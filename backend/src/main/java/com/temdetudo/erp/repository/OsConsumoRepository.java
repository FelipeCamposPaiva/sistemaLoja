package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.OsConsumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OsConsumoRepository
        extends JpaRepository<OsConsumo, Long> {

    List<OsConsumo> findByOsId(
            Long osId
    );

}