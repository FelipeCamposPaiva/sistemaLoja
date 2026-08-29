package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.EstoqueMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstoqueMovimentacaoRepository
        extends JpaRepository<EstoqueMovimentacao, Long> {
}