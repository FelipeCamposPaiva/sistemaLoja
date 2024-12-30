package com.lojas.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
@Table(name = "forma_pagamento")

public class FormaPagamento implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "contas_caixa_gerencial_id")
    private Long contasCaixaGerencialId;

    @Column(name = "nome")
    private String nome;

    @Column(name = "dinheiro")
    private String dinheiro;

    @Column(name = "carne")
    private String carne;

    @Column(name = "vale")
    private String vale;

    @Column(name = "imagem")
    private String imagem;

    @Column(name = "parcelavel")
    private String parcelavel;

    @Column(name = "taxa")
    private String taxa;

    @Column(name = "compra")
    private String compra;

    @Column(name = "venda")
    private String venda;

    @Column(name = "conta")
    private String conta;

    @Column(name = "catalogo")
    private String catalogo;

    @Column(name = "paga_taxa")
    private String pagaTaxa;

    @Column(name = "pix")
    private String pix;

    @Column(name = "codigo_pix")
    private String codigoPix;

    @Column(name = "tipo_chave")
    private String tipoChave;

    @Column(name = "is_mercadopago_credito")
    private boolean isMercadopagoCredito;

    @Column(name = "is_mercadopago_debito")
    private boolean isMercadopagoDebito;

    @Column(name = "is_mercadopago_pix")
    private boolean isMercadopagoPix;

    @Column(name = "ativo")
    private boolean ativo;

    @Column(name = "contas_caixa_gerencial_nome")
    private String contasCaixaGerencialNome;

}
