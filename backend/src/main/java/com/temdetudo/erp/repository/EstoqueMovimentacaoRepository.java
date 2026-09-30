package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.EstoqueMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface EstoqueMovimentacaoRepository
        extends JpaRepository<EstoqueMovimentacao, Long>,
        JpaSpecificationExecutor<EstoqueMovimentacao> {

    List<EstoqueMovimentacao> findByOrigemAndOrigemIdAndStatusIgnoreCase(
            String origem,
            Long origemId,
            String status
    );

    List<EstoqueMovimentacao> findAllByOrderByDataMovimentoDescIdDesc();

    List<EstoqueMovimentacao> findByTipoIgnoreCaseAndDataMovimentoGreaterThanEqual(
            String tipo,
            LocalDateTime inicio
    );
}
