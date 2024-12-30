package com.lojas.modelo.repositorio;

import com.lojas.modelo.Contas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IContas extends JpaRepository<Contas, Long> {

}
