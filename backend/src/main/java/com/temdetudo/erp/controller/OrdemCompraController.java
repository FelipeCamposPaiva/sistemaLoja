package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.OrdemCompra;
import com.temdetudo.erp.entity.OrdemCompraItem;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.OrdemCompraRepository;
import com.temdetudo.erp.repository.OrdemCompraItemRepository;
import com.temdetudo.erp.service.EstoqueAuditoriaService;
import com.temdetudo.erp.service.AuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ordens-compra")
@CrossOrigin("*")
public class OrdemCompraController {

    @Autowired
    private OrdemCompraRepository repository;

    @Autowired
    private OrdemCompraItemRepository itemRepository;

    @Autowired
    private EstoqueAuditoriaService auditoriaService;

    @Autowired
    private AuditoriaService auditoria;

    @GetMapping
    public List<OrdemCompra> listar() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public OrdemCompra buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public OrdemCompra salvar(@RequestBody OrdemCompra ordem) {
        ordem.setDataEmissao(LocalDateTime.now());
        ordem.setStatus("ABERTA");
        OrdemCompra salvo = repository.save(ordem);
        auditoria.registrarCriacao("PEDIDO", salvo.getId(), "OC #" + salvo.getId(), salvo);
        return salvo;
    }

    @PutMapping("/{id}")
    public OrdemCompra atualizar(@PathVariable Long id, @RequestBody OrdemCompra ordem) {
        OrdemCompra anterior = repository.findById(id).orElseThrow();
        var antes = auditoria.snapshot(anterior);
        ordem.setId(id);
        OrdemCompra salvo = repository.save(ordem);
        auditoria.registrarAlteracao("PEDIDO", id, "OC #" + id, antes, auditoria.snapshot(salvo));
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        OrdemCompra ordem = repository.findById(id).orElseThrow();
        if ("RECEBIDA".equalsIgnoreCase(ordem.getStatus())) {
            throw new IllegalStateException(
                    "Pedido já recebido. Estorne o estoque antes de cancelar para manter o histórico."
            );
        }
        repository.deleteById(id);
        auditoria.registrarExclusao("PEDIDO", id, "OC #" + id, ordem);
    }

    @PutMapping("/{id}/receber")
    @Transactional
    public OrdemCompra receber(@PathVariable Long id) {
        OrdemCompra ordem = repository.findById(id).orElseThrow();
        List<OrdemCompraItem> itens = itemRepository.findByOrdemId(id);

        for (OrdemCompraItem item : itens) {
            auditoriaService.registrarEntrada(
                    item.getProdutoId(),
                    item.getQuantidade(),
                    EstoqueOrigem.PEDIDO,
                    id,
                    "Pedido OC #" + id,
                    "Recebimento OC #" + id
            );
        }

        ordem.setStatus("RECEBIDA");
        OrdemCompra salvo = repository.save(ordem);
        auditoria.registrarResumo("PEDIDO", id, "OC #" + id, "ALTERAR", "recebimento da ordem de compra");
        return salvo;
    }

    @PutMapping("/{id}/estornar")
    @Transactional
    public OrdemCompra estornar(@PathVariable Long id) {
        OrdemCompra ordem = repository.findById(id).orElseThrow();
        auditoriaService.estornarOrigem(EstoqueOrigem.PEDIDO, id);
        ordem.setStatus("ESTORNADA");
        OrdemCompra salvo = repository.save(ordem);
        auditoria.registrarResumo("PEDIDO", id, "OC #" + id, "ALTERAR", "estorno da ordem de compra");
        return salvo;
    }
}
