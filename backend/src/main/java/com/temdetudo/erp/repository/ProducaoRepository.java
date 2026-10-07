package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Producao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProducaoRepository
        extends JpaRepository<Producao, Long> {

    List<Producao> findByStatus(
            String status
    );

    boolean existsByNumero(Integer numero);

    @Query("select coalesce(max(p.numero), 0) from Producao p")
    Integer maiorNumero();

}