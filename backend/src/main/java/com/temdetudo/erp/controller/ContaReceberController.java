package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.AgruparParcelarRequest;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.financas.ParcelasConta;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaReceberRepository;
import com.temdetudo.erp.service.JurosMultaService;

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
@RequestMapping("/api/contas-receber")
@CrossOrigin("*")
public class ContaReceberController {

    @Autowired
    private ContaReceberRepository repository;

    @Autowired
    private CaixaRepository caixaRepository;

    @Autowired
    private JurosMultaService jurosMulta;

    @GetMapping
    public List<ContaReceber> listar() {
        return jurosMulta.listarAtualizadas();
    }

    @GetMapping("/{id}")
    public ContaReceber buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public ContaReceber salvar(@RequestBody ContaReceber conta) {
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
        List<ContaReceber> origem = new ArrayList<>();
        Long clienteId = null;
        for (Long id : ids) {
            ContaReceber conta = repository.findById(id).orElseThrow();
            String status = String.valueOf(conta.getStatus() == null ? "ABERTO" : conta.getStatus()).toUpperCase();
            if ("RECEBIDO".equals(status) || "AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                throw new IllegalArgumentException("A conta #" + id + " não está em aberto.");
            }
            if (clienteId == null) {
                clienteId = conta.getClienteId();
            } else if (!Objects.equals(clienteId, conta.getClienteId())) {
                throw new IllegalArgumentException("Agrupe só contas do mesmo cliente.");
            }
            origem.add(conta);
        }
        BigDecimal total = origem.stream()
                .map((c) -> ParcelasConta.saldo(JurosMultaService.totalDe(c), c.getValorPago()))
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
        List<ContaReceber> geradas = new ArrayList<>();
        for (int i = 0; i < valores.size(); i++) {
            ContaReceber nova = new ContaReceber();
            nova.setClienteId(clienteId);
            nova.setDescricao("Parcela " + (i + 1) + "/" + qtd + " — agrupamento das contas #" + origemIds);
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
        for (ContaReceber conta : origem) {
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

    @PutMapping("/receber-lote")
    public Map<String, Object> receberLote(@RequestBody List<Long> ids) {
        int ok = 0;
        int erros = 0;
        List<String> mensagens = new ArrayList<>();
        if (ids != null) {
            for (Long id : ids) {
                try {
                    receber(id, Map.of());
                    ok++;
                } catch (Exception ex) {
                    erros++;
                    mensagens.add(String.valueOf(ex.getMessage()));
                }
            }
        }
        Map<String, Object> saida = new HashMap<>();
        saida.put("ok", ok);
        saida.put("erros", erros);
        saida.put("mensagens", mensagens);
        return saida;
    }

    @PutMapping("/{id}/receber")
    @Transactional
    public ContaReceber receber(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> corpo) {
        ContaReceber conta = repository.findById(id).orElseThrow();
        if ("RECEBIDO".equalsIgnoreCase(conta.getStatus()) || "AGRUPADO".equalsIgnoreCase(conta.getStatus())) {
            return conta;
        }
        jurosMulta.aplicarNaBaixa(conta, LocalDate.now());
        BigDecimal saldo = ParcelasConta.saldo(JurosMultaService.totalDe(conta), conta.getValorPago());
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
            conta.setStatus("RECEBIDO");
            conta.setDataRecebimento(LocalDate.now());
        } else {
            conta.setStatus("PARCIAL");
        }
        ContaReceber contaSalva = repository.save(conta);
        Caixa caixa = new Caixa();
        caixa.setTipo("ENTRADA");
        caixa.setDescricao((resto.compareTo(BigDecimal.ZERO) <= 0 ? "Recebimento" : "Recebimento parcial") + " conta #" + contaSalva.getId());
        caixa.setValor(pagoAgora);
        caixa.setOrigem("CONTAS_RECEBER");
        caixa.setReferenciaId(contaSalva.getId());
        caixa.setCategoria(contaSalva.getCategoria());
        caixa.setDataMovimento(LocalDateTime.now());
        caixaRepository.save(caixa);
        return contaSalva;
    }

    @GetMapping("/{id}/boleto")
    public Map<String, Object> boleto(@PathVariable Long id) {
        ContaReceber conta = jurosMulta.aplicarNaBaixa(repository.findById(id).orElseThrow(), LocalDate.now());
        String status = String.valueOf(conta.getStatus() == null ? "ABERTO" : conta.getStatus()).toUpperCase();
        if ("AGRUPADO".equals(status) || "RECEBIDO".equals(status) || "CANCELADO".equals(status)) {
            throw new IllegalArgumentException("Não há boleto em aberto para esta conta.");
        }
        BigDecimal original = ParcelasConta.nuloZero(conta.getValorOriginal() != null ? conta.getValorOriginal() : conta.getValor());
        BigDecimal saldo = ParcelasConta.saldo(JurosMultaService.totalDe(conta), conta.getValorPago());
        Map<String, Object> saida = new HashMap<>();
        saida.put("id", conta.getId());
        saida.put("descricao", conta.getDescricao());
        saida.put("vencimento", conta.getVencimento());
        saida.put("valorOriginal", original);
        saida.put("valorPago", ParcelasConta.nuloZero(conta.getValorPago()));
        saida.put("valor", saldo);
        saida.put("saldo", saldo);
        return saida;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
