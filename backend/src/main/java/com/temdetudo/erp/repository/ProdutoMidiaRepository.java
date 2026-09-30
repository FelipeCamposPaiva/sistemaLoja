package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.ProdutoMidia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoMidiaRepository extends JpaRepository<ProdutoMidia, Long> {

    List<ProdutoMidia> findByProdutoIdOrderByIdAsc(Long produtoId);

    long countByProdutoIdAndTipo(Long produtoId, String tipo);
}
