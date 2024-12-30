package com.lojas.modelo.repositorio;

import com.lojas.modelo.Caixas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ICaixas extends JpaRepository<Caixas, Long> {

}
