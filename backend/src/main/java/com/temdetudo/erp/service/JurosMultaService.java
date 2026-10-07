package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.entity.FinanceiroParametros;
import com.temdetudo.erp.repository.ContaReceberRepository;
import com.temdetudo.erp.repository.FinanceiroParametrosRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
public class JurosMultaService {

    private static final BigDecimal TRINTA = BigDecimal.valueOf(30);
    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final ContaReceberRepository contaRepository;
    private final FinanceiroParametrosRepository parametrosRepository;

    public JurosMultaService(
            ContaReceberRepository contaRepository,
            FinanceiroParametrosRepository parametrosRepository
    ) {
        this.contaRepository = contaRepository;
        this.parametrosRepository = parametrosRepository;
    }

    public FinanceiroParametros parametros() {
        return parametrosRepository.findById(1L).orElseGet(this::padrao);
    }

    @Transactional
    public FinanceiroParametros salvarParametros(FinanceiroParametros pedido) {
        FinanceiroParametros atual = parametros();
        atual.setId(1L);
        atual.setMultaPercentual(positivo(pedido.getMultaPercentual(), atual.getMultaPercentual()));
        atual.setJurosMesPercentual(positivo(pedido.getJurosMesPercentual(), atual.getJurosMesPercentual()));
        int carencia = pedido.getCarenciaDias() == null ? 0 : Math.max(0, pedido.getCarenciaDias());
        atual.setCarenciaDias(carencia);
        atual.setAtualizadoEm(LocalDateTime.now());
        return parametrosRepository.save(atual);
    }

    @Transactional
    public List<ContaReceber> listarAtualizadas() {
        List<ContaReceber> lista = contaRepository.findAll();
        FinanceiroParametros parametros = parametros();
        LocalDate hoje = LocalDate.now();
        for (ContaReceber conta : lista) {
            if (aberta(conta)) {
                aplicar(conta, parametros, hoje, false);
            } else {
                completarRecebida(conta);
            }
        }
        return lista;
    }

    @Transactional
    public ContaReceber aplicarNaBaixa(ContaReceber conta, LocalDate dataBaixa) {
        return aplicar(conta, parametros(), dataBaixa == null ? LocalDate.now() : dataBaixa, true);
    }

    public ContaReceber aplicar(ContaReceber conta, FinanceiroParametros parametros, LocalDate dataRef, boolean persistirSempre) {
        BigDecimal original = n(conta.getValor());
        int dias = diasAtraso(conta.getVencimento(), dataRef, parametros.getCarenciaDias());
        BigDecimal multa = BigDecimal.ZERO;
        BigDecimal juros = BigDecimal.ZERO;
        if (dias > 0 && original.compareTo(BigDecimal.ZERO) > 0) {
            multa = original.multiply(n(parametros.getMultaPercentual()))
                    .divide(CEM, 2, RoundingMode.HALF_UP);
            juros = original.multiply(n(parametros.getJurosMesPercentual()))
                    .divide(CEM, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(dias))
                    .divide(TRINTA, 2, RoundingMode.HALF_UP);
        }
        BigDecimal atualizado = original.add(multa).add(juros).setScale(2, RoundingMode.HALF_UP);
        boolean mudou = !eq(conta.getJuros(), juros)
                || !eq(conta.getMulta(), multa)
                || !eq(conta.getValorAtualizado(), atualizado)
                || !Objects.equals(conta.getDiasAtraso(), dias);
        conta.setJuros(juros);
        conta.setMulta(multa);
        conta.setValorAtualizado(atualizado);
        conta.setDiasAtraso(dias);
        if (persistirSempre || (mudou && conta.getId() != null)) {
            return contaRepository.save(conta);
        }
        return conta;
    }

    public static BigDecimal totalDe(ContaReceber conta) {
        if (conta.getValorAtualizado() != null) {
            return conta.getValorAtualizado();
        }
        return n(conta.getValor());
    }

    private void completarRecebida(ContaReceber conta) {
        if (conta.getValorAtualizado() != null) {
            return;
        }
        conta.setJuros(n(conta.getJuros()));
        conta.setMulta(n(conta.getMulta()));
        conta.setValorAtualizado(n(conta.getValor()).add(n(conta.getJuros())).add(n(conta.getMulta())));
        if (conta.getDiasAtraso() == null) {
            conta.setDiasAtraso(0);
        }
    }

    private int diasAtraso(LocalDate vencimento, LocalDate dataRef, Integer carencia) {
        if (vencimento == null || dataRef == null) {
            return 0;
        }
        long bruto = ChronoUnit.DAYS.between(vencimento, dataRef);
        int extra = carencia == null ? 0 : Math.max(0, carencia);
        long dias = bruto - extra;
        return dias > 0 ? (int) dias : 0;
    }

    private boolean aberta(ContaReceber conta) {
        String status = conta.getStatus() == null ? "" : conta.getStatus().toUpperCase();
        return !status.equals("RECEBIDO") && !status.equals("CANCELADO") && !status.equals("AGRUPADO") && !status.equals("CREDITO");
    }

    private FinanceiroParametros padrao() {
        FinanceiroParametros p = new FinanceiroParametros();
        p.setId(1L);
        p.setMultaPercentual(new BigDecimal("2.00"));
        p.setJurosMesPercentual(new BigDecimal("1.00"));
        p.setCarenciaDias(0);
        p.setAtualizadoEm(LocalDateTime.now());
        return parametrosRepository.save(p);
    }

    private BigDecimal positivo(BigDecimal pedido, BigDecimal atual) {
        if (pedido == null) {
            return n(atual);
        }
        if (pedido.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Percentual não pode ser negativo.");
        }
        return pedido.setScale(4, RoundingMode.HALF_UP);
    }

    private boolean eq(BigDecimal a, BigDecimal b) {
        return n(a).compareTo(n(b)) == 0;
    }

    private static BigDecimal n(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
