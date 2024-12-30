package com.lojas.modelo.repositorio;

import com.lojas.modelo.Fornecedores;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IFornecedores extends JpaRepository<Fornecedores, Long> {

}
