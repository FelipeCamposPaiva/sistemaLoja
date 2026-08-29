package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.repository.ProdutoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin("*")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @GetMapping
    public List<Produto> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public Produto buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public Produto salvar(
            @RequestBody Produto produto
    ) {

        if (produto.getAtivo() == null) {

            produto.setAtivo(true);

        }

        return repository.save(produto);

    }

    @PutMapping("/{id}")
    public Produto atualizar(
            @PathVariable Long id,
            @RequestBody Produto produto
    ) {

        produto.setId(id);

        return repository.save(produto);

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

    @GetMapping("/buscar")
    public List<Produto> buscarPorTexto(
            @RequestParam String texto
    ) {

        String filtro =
                texto.toLowerCase();

        return repository.findAll()
                .stream()
                .filter(p ->

                        (p.getNome() != null &&
                                p.getNome()
                                        .toLowerCase()
                                        .contains(filtro))

                        ||

                        (p.getSku() != null &&
                                p.getSku()
                                        .toLowerCase()
                                        .contains(filtro))

                        ||

                        (p.getCodigoBarras() != null &&
                                p.getCodigoBarras()
                                        .contains(texto))

                )
                .collect(Collectors.toList());

    }

    @GetMapping("/categoria/{categoria}")
    public List<Produto> categoria(
            @PathVariable String categoria
    ) {

        return repository.findAll()
                .stream()
                .filter(p ->

                        categoria.equalsIgnoreCase(
                                p.getCategoria()
                        )

                )
                .collect(Collectors.toList());

    }

    @GetMapping("/ativos")
    public List<Produto> ativos() {

        return repository.findAll()
                .stream()
                .filter(p ->

                        Boolean.TRUE.equals(
                                p.getAtivo()
                        )

                )
                .collect(Collectors.toList());

    }

    @GetMapping("/estoque-baixo")
    public List<Produto> estoqueBaixo() {

        return repository.findAll()
                .stream()
                .filter(p -> {

                    BigDecimal estoque =
                            p.getEstoque() == null
                                    ? BigDecimal.ZERO
                                    : p.getEstoque();

                    BigDecimal minimo =
                            p.getEstoqueMinimo() == null
                                    ? BigDecimal.ZERO
                                    : p.getEstoqueMinimo();

                    return estoque.compareTo(minimo) <= 0;

                })
                .collect(Collectors.toList());

    }

}