package com.lojas.modelo.repositorio;

import com.lojas.modelo.Vendas;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IVendas extends JpaRepository<Vendas, Long> {

}
