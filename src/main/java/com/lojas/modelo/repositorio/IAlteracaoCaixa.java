package com.lojas.modelo.repositorio;

import com.lojas.modelo.AlteracaoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IAlteracaoCaixa extends JpaRepository<AlteracaoCaixa, Long> {

}
