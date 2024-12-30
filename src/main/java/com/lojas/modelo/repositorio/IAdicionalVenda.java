package com.lojas.modelo.repositorio;


import com.lojas.modelo.AdicionalVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IAdicionalVenda extends JpaRepository<AdicionalVenda, Long> {

}
