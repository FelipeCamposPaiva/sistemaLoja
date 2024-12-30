package com.lojas.modelo.repositorio;

import com.lojas.modelo.TipoDespesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ITipoDespesa extends JpaRepository<TipoDespesa, Long> {

}
