package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.ProdutoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoAnuncioRepository extends JpaRepository<ProdutoAnuncio, Long> {

    List<ProdutoAnuncio> findByProdutoIdOrderByAtualizadoEmDesc(Long produtoId);

    Optional<ProdutoAnuncio> findFirstByProdutoIdAndCanal(Long produtoId, String canal);

    void deleteByCanal(String canal);

    void deleteByProdutoId(Long produtoId);
}
