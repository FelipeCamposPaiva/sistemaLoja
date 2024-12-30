package com.lojas.modelo.repositorio;


import com.lojas.modelo.Grupos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IGrupos extends JpaRepository<Grupos, Long> {

}
