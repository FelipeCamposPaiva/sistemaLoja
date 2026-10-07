package com.temdetudo.erp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "maquina_manutencao_fotos")
public class MaquinaManutencaoFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "manutencao_id")
    private Long manutencaoId;

    @Column(length = 500)
    private String arquivo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getManutencaoId() {
        return manutencaoId;
    }

    public void setManutencaoId(Long manutencaoId) {
        this.manutencaoId = manutencaoId;
    }

    public String getArquivo() {
        return arquivo;
    }

    public void setArquivo(String arquivo) {
        this.arquivo = arquivo;
    }
}
