package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.AgendaEvento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendaEventoRepository
        extends JpaRepository<AgendaEvento, Long> {
}