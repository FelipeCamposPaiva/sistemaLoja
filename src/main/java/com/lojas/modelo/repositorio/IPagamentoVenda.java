package com.lojas.modelo.repositorio;

import com.lojas.modelo.PagamentoVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPagamentoVenda extends JpaRepository<PagamentoVenda, Long> {

}
