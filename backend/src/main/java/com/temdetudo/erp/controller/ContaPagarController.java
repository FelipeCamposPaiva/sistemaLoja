package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.AgruparParcelarRequest;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.financas.ParcelasConta;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contas-pagar")
@CrossOrigin("*")
public class ContaPagarController {

    @Autowired
    private ContaPagarRepository repository;

    @Autowired
    private CaixaRepository caixaRepository;

    @GetMapping
    public List<ContaPagar> listar() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ContaPagar buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public ContaPagar salvar(@RequestBody ContaPagar conta) {
        if (conta.getStatus() == null) {
            conta.setStatus("ABERTO");
        }
        if (conta.getValorPago() == null) {
            conta.setValorPago(BigDecimal.ZERO);
        }
        return repository.save(conta);
    }

    @PostMapping("/agrupar-parcelar")
    @Transactional
    public Map<String, Object> agruparParcelar(@RequestBody AgruparParcelarRequest pedido) {
        List<Long> ids = pedido.getIds() == null ? List.of() : pedido.getIds();
        if (ids.size() < 1) {
            throw new IllegalArgumentException("Selecione ao menos uma conta.");
        }
        List<ContaPagar> origem = new ArrayList<>();
        Long fornecedorId = null;
        for (Long id : ids) {
            ContaPagar conta = repository.findById(id).orElseThrow();
            String status = String.valueOf(conta.getStatus() == null ? "ABERTO" : conta.getStatus()).toUpperCase();
            if ("PAGO".equals(status) || "AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                throw new IllegalArgumentException("A conta #" + id + " não está em aberto.");
            }
            if (fornecedorId == null) {
                fornecedorId = conta.getFornecedorId();
            } else if (!Objects.equals(fornecedorId, conta.getFornecedorId())) {
                throw new IllegalArgumentException("Agrupe só contas do mesmo fornecedor.");
            }
            origem.add(conta);
        }
        BigDecimal total = origem.stream()
                .map((c) -> ParcelasConta.saldo(c.getValor(), c.getValorPago()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Não há saldo para parcelar.");
        }
        int qtd = pedido.getParcelas() == null ? 1 : Math.max(1, pedido.getParcelas());
        int intervalo = pedido.getIntervaloDias() == null ? 30 : pedido.getIntervaloDias();
        BigDecimal totalComJuros = ParcelasConta.comJuros(total, pedido.getJurosPct());
        List<BigDecimal> valores = ParcelasConta.valores(totalComJuros, qtd);
        String origemIds = origem.stream().map((c) -> String.valueOf(c.getId())).collect(Collectors.joining(","));
        Long grupoId = origem.get(0).getId();
        LocalDate primeiro = pedido.getPrimeiroVencimento();
        List<ContaPagar> geradas = new ArrayList<>();
        for (int i = 0; i < valores.size(); i++) {
            ContaPagar nova = new ContaPagar();
            nova.setFornecedorId(fornecedorId);
            nova.setObservacao("Parcela " + (i + 1) + "/" + qtd + " — agrupamento das contas #" + origemIds);
            nova.setValor(valores.get(i));
            nova.setValorOriginal(valores.get(i));
            nova.setValorPago(BigDecimal.ZERO);
            nova.setVencimento(ParcelasConta.vencimento(primeiro, i, intervalo));
            nova.setStatus("ABERTO");
            nova.setGrupoId(grupoId);
            nova.setParcela(i + 1);
            nova.setParcelas(qtd);
            nova.setJurosPct(pedido.getJurosPct());
            nova.setOrigemIds(origemIds);
            geradas.add(repository.save(nova));
        }
        for (ContaPagar conta : origem) {
            conta.setStatus("AGRUPADO");
            conta.setGrupoId(grupoId);
            conta.setOrigemIds(origemIds);
            repository.save(conta);
        }
        Map<String, Object> saida = new HashMap<>();
        saida.put("agrupadas", origem.size());
        saida.put("geradas", geradas.size());
        saida.put("total", total);
        saida.put("totalComJuros", totalComJuros);
        saida.put("grupoId", grupoId);
        saida.put("parcelas", geradas);
        return saida;
    }

    @PutMapping("/{id}/baixar")
    @Transactional
    public ContaPagar baixar(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> corpo) {
        ContaPagar conta = repository.findById(id).orElseThrow();
        if ("PAGO".equalsIgnoreCase(conta.getStatus()) || "AGRUPADO".equalsIgnoreCase(conta.getStatus())) {
            return conta;
        }
        BigDecimal saldo = ParcelasConta.saldo(conta.getValor(), conta.getValorPago());
        BigDecimal pagoAgora = saldo;
        if (corpo != null && corpo.get("valor") != null) {
            try {
                pagoAgora = new BigDecimal(String.valueOf(corpo.get("valor")));
            } catch (Exception ex) {
                pagoAgora = saldo;
            }
        }
        if (pagoAgora.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Informe um valor maior que zero.");
        }
        if (pagoAgora.compareTo(saldo) > 0) {
            pagoAgora = saldo;
        }
        BigDecimal acumulado = ParcelasConta.nuloZero(conta.getValorPago()).add(pagoAgora);
        conta.setValorPago(acumulado);
        BigDecimal resto = ParcelasConta.saldo(conta.getValor(), acumulado);
        if (resto.compareTo(BigDecimal.ZERO) <= 0) {
            conta.setStatus("PAGO");
            conta.setDataPagamento(LocalDate.now());
        } else {
            conta.setStatus("PARCIAL");
        }
        ContaPagar contaSalva = repository.save(conta);
        Caixa caixa = new Caixa();
        caixa.setTipo("SAIDA");
        caixa.setDescricao((resto.compareTo(BigDecimal.ZERO) <= 0 ? "Pagamento" : "Pagamento parcial") + " conta #" + contaSalva.getId());
        caixa.setValor(pagoAgora);
        caixa.setOrigem("CONTAS_PAGAR");
        caixa.setReferenciaId(contaSalva.getId());
        caixa.setCategoria(contaSalva.getCategoria());
        caixa.setDataMovimento(LocalDateTime.now());
        caixaRepository.save(caixa);
        return contaSalva;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
