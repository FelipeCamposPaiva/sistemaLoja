package com.lojas.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.sql.Timestamp;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
@Table(name = "pagamento_venda")

public class PagamentoVenda implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "vendas_id")
    private Long vendasId;

    @Column(name = "forma_pagamentos_id")
    private Long formaPagamentosId;

    @Column(name = "vales_id")
    private Long valesId;

    @Column(name = "caixas_id")
    private Long caixasId;

    @Column(name = "nome")
    private String nome;

    @Column(name = "taxa")
    private Float taxa;

    @Column(name = "parcelas")
    private Float parcelas;

    @Column(name = "valor_dinheiro")
    private double valorDinheiro;

    @Column(name = "troco")
    private Float troco;

    @Column(name = "valor")
    private double valor;

    @Column(name = "datahora")
    private Timestamp datahora;

    @Column(name = "requisicao_mp")
    private Float requisicaoMp;

    @Column(name = "status_mp")
    private Float statusMp;

    @Column(name = "pagamento_mp")
    private Float pagamentoMp;

    @Column(name = "reembolso_mp")
    private Float reembolsoMp;

    @Column(name = "ativo")
    private Float ativo;

    @Column(name = "pagamento_venda_id")
    private Long pagamentoVendaId;

    @Column(name = "vales_codigo")
    private String valesCodigo;

    @Column(name = "carne")
    private Float carne;

    @Column(name = "parcelavel")
    private Float parcelavel;

    @Column(name = "forma_pagamentos_nome")
    private String formaPagamentosNome;

    @Column(name = "data_abertura_caixa")
    private Timestamp dataAberturaCaixa;

    @Column(name = "usuarios_caixa")
    private Float usuariosCaixa;

    @Column(name = "vale")
    private Float vale;

    @Column(name = "vendas_codigo")
    private String vendasCodigo;

    @Column(name = "contas_caixa_gerencial_id")
    private Long contasCaixaGerencialId;

    @Column(name = "numero_os")
    private Float numeroOs;

    @Column(name = "is_mercadopago_credito")
    private Float isMercadopagoCredito;

    @Column(name = "is_mercadopago_debito")
    private Float isMercadopagoDebito;

    @Column(name = "is_mercadopago_pix")
    private Float isMercadopagoPix;

}
