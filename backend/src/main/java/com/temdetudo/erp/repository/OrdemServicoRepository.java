package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdemServicoRepository
        extends JpaRepository<OrdemServico, Long> {

    Optional<OrdemServico> findTopByOrderByNumeroDesc();

    Optional<OrdemServico> findFirstByNumero(Integer numero);

    @Query("""
            SELECT o FROM OrdemServico o
            WHERE o.maquinaId = :id
               OR LOWER(COALESCE(o.equipamento, '')) = LOWER(:nome)
               OR (LENGTH(:nome) >= 6 AND LOWER(COALESCE(o.equipamento, '')) LIKE LOWER(CONCAT('%', :nome, '%')))
            ORDER BY o.dataAbertura DESC
            """)
    List<OrdemServico> vincular(@Param("id") Long id, @Param("nome") String nome);
}