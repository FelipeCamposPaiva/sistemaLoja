package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.LocalEstoque;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocalEstoqueRepository extends JpaRepository<LocalEstoque, Integer> {

    List<LocalEstoque> findByAtivoTrueOrderByIdAsc();

    Optional<LocalEstoque> findBySiglaIgnoreCase(String sigla);
}
