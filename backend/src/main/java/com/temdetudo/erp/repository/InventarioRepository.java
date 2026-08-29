package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventarioRepository
        extends JpaRepository<Inventario, Long> {
}