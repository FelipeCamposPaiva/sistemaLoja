package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.OrdemCompraItem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdemCompraItemRepository
        extends JpaRepository<OrdemCompraItem, Long> {

    List<OrdemCompraItem> findByOrdemId(
            Long ordemId
    );

}