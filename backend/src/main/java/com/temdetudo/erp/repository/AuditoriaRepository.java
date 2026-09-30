package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.AuditoriaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<AuditoriaLog, Long> {

    List<AuditoriaLog> findTop300ByOrderByCriadoEmDesc();

    List<AuditoriaLog> findByEntidadeAndRegistroIdOrderByCriadoEmDesc(String entidade, Long registroId);

    List<AuditoriaLog> findByEntidadeOrderByCriadoEmDesc(String entidade);
}
