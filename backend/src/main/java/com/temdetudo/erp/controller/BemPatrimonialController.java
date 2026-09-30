package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.BemPatrimonial;
import com.temdetudo.erp.repository.BemPatrimonialRepository;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bens-patrimoniais")
@CrossOrigin("*")
public class BemPatrimonialController {

    private final BemPatrimonialRepository repository;

    public BemPatrimonialController(BemPatrimonialRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<BemPatrimonial> listar() {
        return repository.findAll();
    }

    @PostMapping
    public BemPatrimonial salvar(@RequestBody BemPatrimonial bem) {
        return repository.save(preparar(bem, new BemPatrimonial()));
    }

    @PutMapping("/{id}")
    public BemPatrimonial atualizar(@PathVariable Long id, @RequestBody BemPatrimonial pedido) {
        BemPatrimonial bem = repository.findById(id).orElseThrow();
        return repository.save(preparar(pedido, bem));
    }

    @PutMapping("/{id}/baixar")
    public BemPatrimonial baixar(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> corpo) {
        BemPatrimonial bem = repository.findById(id).orElseThrow();
        bem.setStatus("BAIXADO");
        if (corpo != null && corpo.get("dataBaixa") != null && !String.valueOf(corpo.get("dataBaixa")).isBlank()) {
            bem.setDataBaixa(LocalDate.parse(String.valueOf(corpo.get("dataBaixa"))));
        } else if (bem.getDataBaixa() == null) {
            bem.setDataBaixa(LocalDate.now());
        }
        return repository.save(bem);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }

    private BemPatrimonial preparar(BemPatrimonial pedido, BemPatrimonial alvo) {
        if (pedido.getNome() == null || pedido.getNome().isBlank()) {
            throw new IllegalArgumentException("Informe o nome do bem.");
        }
        alvo.setNome(pedido.getNome().trim());
        alvo.setTipo(pedido.getTipo() == null || pedido.getTipo().isBlank() ? "EQUIPAMENTO" : pedido.getTipo().trim().toUpperCase());
        alvo.setDescricao(pedido.getDescricao());
        alvo.setValorAquisicao(pedido.getValorAquisicao() == null ? BigDecimal.ZERO : pedido.getValorAquisicao());
        alvo.setDataAquisicao(pedido.getDataAquisicao());
        alvo.setLocalizacao(pedido.getLocalizacao());
        alvo.setObservacao(pedido.getObservacao());
        if (pedido.getStatus() == null || pedido.getStatus().isBlank()) {
            alvo.setStatus(alvo.getStatus() == null ? "ATIVO" : alvo.getStatus());
        } else {
            alvo.setStatus(pedido.getStatus().trim().toUpperCase());
        }
        alvo.setDataBaixa(pedido.getDataBaixa());
        if ("BAIXADO".equals(alvo.getStatus()) && alvo.getDataBaixa() == null) {
            alvo.setDataBaixa(LocalDate.now());
        }
        return alvo;
    }
}
