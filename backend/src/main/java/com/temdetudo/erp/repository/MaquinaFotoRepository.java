package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.MaquinaFoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaquinaFotoRepository extends JpaRepository<MaquinaFoto, Long> {

    List<MaquinaFoto> findByMaquinaIdOrderByOrdemAscIdAsc(Long maquinaId);

    Optional<MaquinaFoto> findFirstByMaquinaIdOrderByOrdemAscIdAsc(Long maquinaId);
}
