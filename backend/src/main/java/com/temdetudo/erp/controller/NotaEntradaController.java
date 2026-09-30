package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.NotaEntrada;
import com.temdetudo.erp.entity.NotaEntradaItem;
import com.temdetudo.erp.entity.ContaPagar;

import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.NotaEntradaRepository;
import com.temdetudo.erp.repository.NotaEntradaItemRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;
import com.temdetudo.erp.service.AuditoriaService;
import com.temdetudo.erp.service.EstoqueAuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notas-entrada")
@CrossOrigin("*")
public class NotaEntradaController {

    @Autowired
    private NotaEntradaRepository repository;

    @Autowired
    private NotaEntradaItemRepository itemRepository;

    @Autowired
    private ContaPagarRepository contaPagarRepository;

    @Autowired
    private EstoqueAuditoriaService auditoriaService;

    @Autowired
    private AuditoriaService auditoria;

    @GetMapping
    public List<NotaEntrada> listar() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public NotaEntrada buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public NotaEntrada salvar(@RequestBody NotaEntrada nota) {
        if (nota.getDataEntrada() == null) {
            nota.setDataEntrada(nota.getDataEmissao() != null ? nota.getDataEmissao() : LocalDateTime.now());
        }
        if (nota.getStatus() == null || nota.getStatus().isBlank()) {
            nota.setStatus("LANÇADA");
        }
        NotaEntrada salvo = repository.save(nota);
        auditoria.registrarCriacao("NOTA", salvo.getId(), nomeNf(salvo), salvo);
        return salvo;
    }

    @PutMapping("/{id}")
    public NotaEntrada atualizar(@PathVariable Long id, @RequestBody NotaEntrada nota) {
        NotaEntrada atual = repository.findById(id).orElseThrow();
        if (nota.getNumeroNf() != null) {
            atual.setNumeroNf(nota.getNumeroNf());
        }
        if (nota.getFornecedorId() != null) {
            atual.setFornecedorId(nota.getFornecedorId());
        }
        if (nota.getDataEmissao() != null) {
            atual.setDataEmissao(nota.getDataEmissao());
        }
        if (nota.getDataEntrada() != null) {
            atual.setDataEntrada(nota.getDataEntrada());
        }
        if (nota.getValorTotal() != null) {
            atual.setValorTotal(nota.getValorTotal());
            atual.setValorProdutos(nota.getValorProdutos() != null ? nota.getValorProdutos() : nota.getValorTotal());
        }
        if (nota.getObservacao() != null) {
            atual.setObservacao(nota.getObservacao());
        }
        NotaEntrada salvo = repository.save(atual);
        auditoria.registrarResumo("NOTA", id, nomeNf(salvo), "ALTERAR", "dados da nota de entrada");
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        NotaEntrada nota = repository.findById(id).orElseThrow();
        if ("RECEBIDA".equalsIgnoreCase(nota.getStatus())) {
            throw new IllegalStateException(
                    "Nota já recebida. Estorne o estoque antes de cancelar para manter o histórico."
            );
        }
        repository.deleteById(id);
        auditoria.registrarExclusao("NOTA", id, nomeNf(nota), nota);
    }

    @PutMapping("/{id}/confirmar")
    @Transactional
    public NotaEntrada confirmar(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> corpo
    ) {
        NotaEntrada nota = repository.findById(id).orElseThrow();

        if ("RECEBIDA".equalsIgnoreCase(nota.getStatus())) {
            return nota;
        }

        boolean jaTeveRecebimento = "ESTORNADA".equalsIgnoreCase(nota.getStatus());

        LocalDateTime dataEstoque = resolverDataEstoque(nota, corpo);
        if (corpo != null && "MANUAL".equalsIgnoreCase(String.valueOf(corpo.getOrDefault("modoData", "")))) {
            nota.setDataEntrada(dataEstoque);
        }

        String modo = corpo == null || corpo.get("modoData") == null
                ? "ENTRADA"
                : String.valueOf(corpo.get("modoData")).trim().toUpperCase();
        gravarMetaEstoque(nota, modo, dataEstoque);

        List<NotaEntradaItem> itens = itemRepository.findByNotaEntradaId(id);
        String origemRef = "NF " + (nota.getNumeroNf() == null ? id : nota.getNumeroNf());

        for (NotaEntradaItem item : itens) {
            if (item.getProdutoId() == null || item.getQuantidade() == null) {
                continue;
            }
            auditoriaService.registrarEntrada(
                    item.getProdutoId(),
                    item.getQuantidade(),
                    EstoqueOrigem.NF,
                    id,
                    origemRef,
                    "Nota Entrada #" + id,
                    dataEstoque
            );
        }

        if (!jaTeveRecebimento) {
            ContaPagar conta = new ContaPagar();
            conta.setFornecedorId(nota.getFornecedorId());
            conta.setValor(nota.getValorTotal());
            conta.setVencimento(LocalDate.now().plusDays(30));
            conta.setStatus("ABERTO");
            conta.setObservacao("Gerado pela NF " + nota.getNumeroNf());
            contaPagarRepository.save(conta);
        }

        nota.setStatus("RECEBIDA");
        NotaEntrada salvo = repository.save(nota);
        auditoria.registrarResumo("NOTA", id, nomeNf(salvo), "ALTERAR",
                "confirmação de recebimento da nota — estoque em " + dataEstoque.toLocalDate());
        return salvo;
    }

    @PutMapping("/{id}/estornar")
    @Transactional
    public NotaEntrada estornar(@PathVariable Long id) {
        NotaEntrada nota = repository.findById(id).orElseThrow();
        auditoriaService.estornarOrigem(EstoqueOrigem.NF, id);
        nota.setStatus("ESTORNADA");
        NotaEntrada salvo = repository.save(nota);
        auditoria.registrarResumo("NOTA", id, nomeNf(salvo), "ALTERAR", "estorno da nota de entrada");
        return salvo;
    }

    private String nomeNf(NotaEntrada nota) {
        return "NF " + (nota.getNumeroNf() == null || nota.getNumeroNf().isBlank()
                ? String.valueOf(nota.getId())
                : nota.getNumeroNf());
    }

    private LocalDateTime resolverDataEstoque(NotaEntrada nota, java.util.Map<String, Object> corpo) {
        String modo = corpo == null || corpo.get("modoData") == null
                ? "ENTRADA"
                : String.valueOf(corpo.get("modoData")).trim().toUpperCase();
        if ("ATUAL".equals(modo) || "HOJE".equals(modo)) {
            return LocalDateTime.now();
        }
        if ("MANUAL".equals(modo)) {
            LocalDateTime manual = parseData(corpo.get("dataMovimento"));
            if (manual == null) {
                throw new IllegalArgumentException("Informe a data manual do movimento de estoque.");
            }
            return manual;
        }
        if (nota.getDataEntrada() != null) {
            return nota.getDataEntrada();
        }
        if (nota.getDataEmissao() != null) {
            return nota.getDataEmissao();
        }
        return LocalDateTime.now();
    }

    private void gravarMetaEstoque(NotaEntrada nota, String modo, LocalDateTime dataEstoque) {
        String texto = nota.getObservacao();
        java.util.Map<String, Object> extra = new java.util.LinkedHashMap<>();
        if (texto != null && !texto.isBlank() && texto.trim().startsWith("{")) {
            try {
                extra.putAll(new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        texto, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {}
                ));
            } catch (Exception ignored) {
                extra.put("observacao", texto);
            }
        } else if (texto != null && !texto.isBlank()) {
            extra.put("observacao", texto);
        }
        extra.put("modoDataEstoque", modo);
        extra.put("dataEstoque", dataEstoque == null ? "" : dataEstoque.toLocalDate().toString());
        try {
            nota.setObservacao(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(extra));
        } catch (Exception ignored) {
            /* metadado opcional */
        }
    }

    private LocalDateTime parseData(Object valor) {
        if (valor == null) {
            return null;
        }
        String texto = String.valueOf(valor).trim();
        if (texto.isBlank() || "null".equalsIgnoreCase(texto)) {
            return null;
        }
        try {
            if (texto.length() <= 10) {
                return LocalDate.parse(texto.substring(0, 10)).atTime(12, 0);
            }
            return LocalDateTime.parse(texto.replace(" ", "T").substring(0, Math.min(19, texto.length())));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Data do movimento inválida.");
        }
    }
}
