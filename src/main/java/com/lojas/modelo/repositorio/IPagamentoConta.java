package com.lojas.modelo.repositorio;


import com.lojas.modelo.PagamentoConta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPagamentoConta extends JpaRepository<PagamentoConta, Long> {

}
