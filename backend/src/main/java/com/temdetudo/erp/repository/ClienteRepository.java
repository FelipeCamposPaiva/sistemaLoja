package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findFirstByTinyId(Integer tinyId);

    Optional<Cliente> findFirstByNomeIgnoreCase(String nome);

    Optional<Cliente> findFirstByCpfCnpj(String cpfCnpj);

    @Query(value = """
            SELECT * FROM clientes
            WHERE REPLACE(REPLACE(REPLACE(REPLACE(IFNULL(cpf_cnpj, ''), '.', ''), '-', ''), '/', ''), ' ', '') = :digitos
            LIMIT 1
            """, nativeQuery = true)
    Optional<Cliente> findByDocumentoDigitos(@Param("digitos") String digitos);

}
