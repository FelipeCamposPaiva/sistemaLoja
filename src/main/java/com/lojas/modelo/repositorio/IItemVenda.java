package com.lojas.modelo.repositorio;


import com.lojas.modelo.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IItemVenda extends JpaRepository<ItemVenda, Long> {

}
