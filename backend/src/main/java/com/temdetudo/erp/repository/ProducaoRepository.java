package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Producao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProducaoRepository
        extends JpaRepository<Producao, Long> {

    List<Producao> findByStatus(
            String status
    );

}