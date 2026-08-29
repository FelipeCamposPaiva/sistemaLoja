package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrdemServicoRepository
        extends JpaRepository<OrdemServico, Long> {
}