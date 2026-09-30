package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Produto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProdutoRepository
        extends JpaRepository<Produto, Long> {

    List<Produto> findByNomeContainingIgnoreCase(
            String nome
    );

    List<Produto> findByCategoriaIgnoreCase(
            String categoria
    );

    List<Produto> findByAtivo(
            Boolean ativo
    );

    List<Produto> findBySkuContainingIgnoreCase(
            String sku
    );

    List<Produto> findByCodigoBarrasContaining(
            String codigoBarras
    );

    List<Produto> findByFornecedorId(
            Long fornecedorId
    );

    List<Produto> findByMarcaId(
            Integer marcaId
    );

    List<Produto> findByProdutoProducao(
            Boolean produtoProducao
    );

    java.util.Optional<Produto> findFirstBySkuIgnoreCase(
            String sku
    );

    java.util.Optional<Produto> findFirstByCodigoBarras(
            String codigoBarras
    );

    List<Produto> findByConsomeEstoque(
            Boolean consomeEstoque
    );

    List<Produto> findByEstoqueLessThanEqual(
            BigDecimal estoque
    );

}