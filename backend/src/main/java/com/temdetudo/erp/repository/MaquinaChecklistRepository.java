package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.MaquinaChecklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaquinaChecklistRepository extends JpaRepository<MaquinaChecklist, Long> {

    List<MaquinaChecklist> findByMaquinaIdOrderByOrdemAscIdAsc(Long maquinaId);
}
