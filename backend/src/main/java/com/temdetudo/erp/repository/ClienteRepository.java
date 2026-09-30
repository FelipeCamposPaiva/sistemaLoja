package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findFirstByTinyId(Integer tinyId);

    Optional<Cliente> findFirstByCpfCnpj(String cpfCnpj);

}
