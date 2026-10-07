package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.MaquinaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaquinaDocumentoRepository extends JpaRepository<MaquinaDocumento, Long> {

    List<MaquinaDocumento> findByMaquinaIdOrderByIdAsc(Long maquinaId);
}
