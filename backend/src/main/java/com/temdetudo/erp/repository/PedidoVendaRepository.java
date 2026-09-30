package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.PedidoVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoVendaRepository extends JpaRepository<PedidoVenda, Integer> {

    Optional<PedidoVenda> findFirstByNumero(String numero);

    List<PedidoVenda> findByDataPedidoGreaterThanEqual(LocalDateTime inicio);
}
