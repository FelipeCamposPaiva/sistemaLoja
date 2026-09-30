package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "produto_anuncio")
public class ProdutoAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "produto_id")
    private Long produtoId;

    private String canal;

    private String codigo;

    private String status;

    @Column(name = "video_enviado")
    private Boolean videoEnviado;

    @Column(name = "fotos_enviadas")
    private Integer fotosEnviadas;

    @Column(name = "video_remoto")
    private String videoRemoto;

    private String mensagem;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getVideoEnviado() {
        return videoEnviado;
    }

    public void setVideoEnviado(Boolean videoEnviado) {
        this.videoEnviado = videoEnviado;
    }

    public Integer getFotosEnviadas() {
        return fotosEnviadas;
    }

    public void setFotosEnviadas(Integer fotosEnviadas) {
        this.fotosEnviadas = fotosEnviadas;
    }

    public String getVideoRemoto() {
        return videoRemoto;
    }

    public void setVideoRemoto(String videoRemoto) {
        this.videoRemoto = videoRemoto;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
