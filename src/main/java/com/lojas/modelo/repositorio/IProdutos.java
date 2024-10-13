package com.lojas.modelo.repositorio;

import com.lojas.modelo.Produtos;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IProdutos extends JpaRepository<Produtos, Long> {

}
