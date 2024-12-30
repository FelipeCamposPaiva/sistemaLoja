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
@Table(name = "alteracao_caixa")

public class AlteracaoCaixa implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "contas_caixa_gerencial_id")
    private Long contasCaixaGerencialId;

    @Column(name = "nome")
    private Float nome;

    @Column(name = "dinheiro")
    private Float dinheiro;

    @Column(name = "carne")
    private String carne;

    @Column(name = "vale")
    private Float vale;

    @Column(name = "imagem")
    private String imagem;

    @Column(name = "parcelavel")
    private Float parcelavel;

    @Column(name = "taxa")
    private Float taxa;

    @Column(name = "compra")
    private Float compra;

    @Column(name = "venda")
    private Float venda;

    @Column(name = "conta")
    private String conta;

    @Column(name = "catalogo")
    private Float catalogo;

    @Column(name = "paga_taxa")
    private String pagaTaxa;

    @Column(name = "pix")
    private String pix;

    @Column(name = "codigo_pix")
    private Float codigoPix;

    @Column(name = "tipo_chave")
    private String tipoChave;

    @Column(name = "is_mercadopago_credito")
    private Float isMercadopagoCredito;

    @Column(name = "is_mercadopago_debito")
    private Float isMercadopagoDebito;

    @Column(name = "is_mercadopago_pix")
    private Float isMercadopagoPix;

    @Column(name = "ativo")
    private Float ativo;

    @Column(name = "contas_caixa_gerencial_nome")
    private String contasCaixaGerencialNome;

}
