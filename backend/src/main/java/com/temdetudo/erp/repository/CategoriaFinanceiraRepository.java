package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.CategoriaFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaFinanceiraRepository extends JpaRepository<CategoriaFinanceira, Long> {

    List<CategoriaFinanceira> findAllByOrderByOrdemAscCodigoAsc();
}
