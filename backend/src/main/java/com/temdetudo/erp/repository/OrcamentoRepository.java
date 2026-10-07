package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Orcamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    Optional<Orcamento> findFirstByNumero(String numero);
}
