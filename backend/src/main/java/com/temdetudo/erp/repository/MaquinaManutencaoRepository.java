package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.MaquinaManutencao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaquinaManutencaoRepository extends JpaRepository<MaquinaManutencao, Long> {

    List<MaquinaManutencao> findByMaquinaIdOrderByDataDescIdDesc(Long maquinaId);

    int countByMaquinaId(Long maquinaId);
}
