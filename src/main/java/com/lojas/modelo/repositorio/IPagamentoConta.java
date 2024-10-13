package com.lojas.modelo.repositorio;


import com.lojas.modelo.PagamentoConta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IPagamentoConta extends JpaRepository<PagamentoConta, Long> {

}
