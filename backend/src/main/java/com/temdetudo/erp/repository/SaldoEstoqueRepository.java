package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.SaldoEstoque;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SaldoEstoqueRepository extends JpaRepository<SaldoEstoque, Integer> {

    List<SaldoEstoque> findByProdutoId(Long produtoId);

    Optional<SaldoEstoque> findByProdutoIdAndLocalId(Long produtoId, Integer localId);
}
