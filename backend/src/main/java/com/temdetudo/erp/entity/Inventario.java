package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventarios")
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "local_id")
    private Integer localId;

    @Column(name = "data_inventario")
    private LocalDateTime dataInventario;

    @Column(name = "usuario_id")
    private Integer usuarioId;

    private String observacao;

    @Column(length = 255)
    private String localizacao;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getLocalId() {
        return localId;
    }

    public void setLocalId(Integer localId) {
        this.localId = localId;
    }

    public LocalDateTime getDataInventario() {
        return dataInventario;
    }

    public void setDataInventario(LocalDateTime dataInventario) {
        this.dataInventario = dataInventario;
    }

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Integer usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public String getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(String localizacao) {
        this.localizacao = localizacao;
    }
}