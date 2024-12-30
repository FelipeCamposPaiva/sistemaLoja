package com.lojas.modelo.repositorio;


import com.lojas.modelo.Clientes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IClientes extends JpaRepository<Clientes, Long> {

}
