package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Produto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    @Query("SELECT p.marcaId, COUNT(p) FROM Produto p WHERE p.marcaId IS NOT NULL GROUP BY p.marcaId")
    List<Object[]> contarPorMarcaId();

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

    @Query("""
            SELECT p.id, p.sku, p.nome, p.preco, p.precoPromocional, p.descontoPercentual,
                   p.unidade, p.categoria, p.marcaId, p.estoque, p.imagem, p.ativo
            FROM Produto p
            """)
    List<Object[]> listarResumoVitrine();

}