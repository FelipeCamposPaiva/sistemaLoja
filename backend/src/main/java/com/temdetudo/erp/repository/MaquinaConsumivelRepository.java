package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.MaquinaConsumivel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaquinaConsumivelRepository extends JpaRepository<MaquinaConsumivel, Long> {

    List<MaquinaConsumivel> findByMaquinaIdOrderByIdAsc(Long maquinaId);
}
