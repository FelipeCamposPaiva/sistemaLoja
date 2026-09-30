package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.EstoqueAuditoriaDTO;
import com.temdetudo.erp.dto.TransferenciaEstoqueRequest;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.LocalEstoque;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.service.EstoqueAuditoriaService;
import com.temdetudo.erp.service.EstoqueLocalService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estoque")
@CrossOrigin("*")
public class EstoqueMovimentacaoController {

    private final EstoqueAuditoriaService auditoriaService;
    private final EstoqueLocalService estoqueLocalService;

    public EstoqueMovimentacaoController(
            EstoqueAuditoriaService auditoriaService,
            EstoqueLocalService estoqueLocalService
    ) {
        this.auditoriaService = auditoriaService;
        this.estoqueLocalService = estoqueLocalService;
    }

    @GetMapping("/locais")
    public List<LocalEstoque> locais() {
        return estoqueLocalService.listarLocais();
    }

    @GetMapping("/saldos/{produtoId}")
    public List<Map<String, Object>> saldos(@PathVariable Long produtoId) {
        return estoqueLocalService.saldosDoProduto(produtoId);
    }

    @PostMapping("/transferir")
    public List<Map<String, Object>> transferir(@RequestBody TransferenciaEstoqueRequest pedido) {
        return estoqueLocalService.transferir(pedido);
    }

    @GetMapping
    public List<EstoqueAuditoriaDTO> listar() {
        return auditoriaService.consultar(null, null, null, null, null, null, null);
    }

    @GetMapping("/auditoria")
    public List<EstoqueAuditoriaDTO> auditoria(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long produtoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate
    ) {
        return auditoriaService.consultar(usuarioId, produtoId, tipo, origem, status, de, ate);
    }

    @GetMapping("/auditoria/filtros")
    public Map<String, Object> filtros() {
        return auditoriaService.filtros();
    }

    @PostMapping
    public EstoqueMovimentacao salvar(@RequestBody EstoqueMovimentacao movimentacao) {
        if (movimentacao.getOrigem() == null || movimentacao.getOrigem().isBlank()) {
            movimentacao.setOrigem(EstoqueOrigem.MANUAL);
        }
        return auditoriaService.registrar(movimentacao);
    }

    @PutMapping("/{id}/estornar")
    public EstoqueMovimentacao estornar(@PathVariable Long id) {
        return auditoriaService.estornar(id);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        throw new IllegalStateException(
                "Movimentações de estoque não são excluídas. Use o estorno para manter o histórico."
        );
    }
}
