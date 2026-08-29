package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.InventarioItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventarioItemRepository
        extends JpaRepository<InventarioItem, Long> {

    List<InventarioItem> findByInventarioId(
            Long inventarioId
    );

}