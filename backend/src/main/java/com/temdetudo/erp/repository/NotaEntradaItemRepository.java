package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.NotaEntradaItem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotaEntradaItemRepository
        extends JpaRepository<NotaEntradaItem, Long> {

    List<NotaEntradaItem> findByNotaEntradaId(
            Long notaEntradaId
    );

}