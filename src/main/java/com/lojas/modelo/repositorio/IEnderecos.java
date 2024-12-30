package com.lojas.modelo.repositorio;

import com.lojas.modelo.Enderecos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IEnderecos extends JpaRepository<Enderecos, Long> {

}
