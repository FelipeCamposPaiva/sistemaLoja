package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MaquinaRepository extends JpaRepository<Maquina, Long> {

    Optional<Maquina> findByCodigoPublico(String codigoPublico);
}
