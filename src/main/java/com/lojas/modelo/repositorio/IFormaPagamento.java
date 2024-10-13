package com.lojas.modelo.repositorio;

import com.lojas.modelo.FormaPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IFormaPagamento extends JpaRepository<FormaPagamento, Long> {

}
