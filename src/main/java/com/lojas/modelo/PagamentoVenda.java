package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import java.sql.Timestamp;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
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
    private String taxa;

    @Column(name = "parcelas")
    private String parcelas;

    @Column(name = "valor_dinheiro")
    private double valorDinheiro;

    @Column(name = "troco")
    private String troco;

    @Column(name = "valor")
    private double valor;

    @Column(name = "datahora")
    private Timestamp datahora;

    @Column(name = "requisicao_mp")
    private boolean requisicaoMp;

    @Column(name = "status_mp")
    private String statusMp;

    @Column(name = "pagamento_mp")
    private String pagamentoMp;

    @Column(name = "reembolso_mp")
    private String reembolsoMp;

    @Column(name = "ativo")
    private boolean ativo;

    @Column(name = "pagamento_venda_id")
    private Long pagamentoVendaId;

    @Column(name = "vales_codigo")
    private String valesCodigo;

    @Column(name = "carne")
    private String carne;

    @Column(name = "parcelavel")
    private String parcelavel;

    @Column(name = "forma_pagamentos_nome")
    private String formaPagamentosNome;

    @Column(name = "data_abertura_caixa")
    private Timestamp dataAberturaCaixa;

    @Column(name = "usuarios_caixa")
    private String usuariosCaixa;

    @Column(name = "vale")
    private String vale;

    @Column(name = "vendas_codigo")
    private String vendasCodigo;

    @Column(name = "contas_caixa_gerencial_id")
    private Long contasCaixaGerencialId;

    @Column(name = "numero_os")
    private String numeroOs;

    @Column(name = "is_mercadopago_credito")
    private boolean isMercadopagoCredito;

    @Column(name = "is_mercadopago_debito")
    private boolean isMercadopagoDebito;

    @Column(name = "is_mercadopago_pix")
    private boolean isMercadopagoPix;

}
