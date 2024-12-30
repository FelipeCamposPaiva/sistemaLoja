package com.lojas.modelo.repositorio;

import com.lojas.modelo.Marcas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IMarcas extends JpaRepository<Marcas, Long> {

}
