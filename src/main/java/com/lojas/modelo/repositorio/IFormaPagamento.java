package com.lojas.modelo.repositorio;

import com.lojas.modelo.FormaPagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IFormaPagamento extends JpaRepository<FormaPagamento, Long> {

}
