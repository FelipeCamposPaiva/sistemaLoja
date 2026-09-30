package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.NaturezaOperacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NaturezaOperacaoRepository extends JpaRepository<NaturezaOperacao, Long> {

    Optional<NaturezaOperacao> findByCodigo(String codigo);

    List<NaturezaOperacao> findByAtivoTrueOrderByPrioridadeAscNomeAsc();
}
