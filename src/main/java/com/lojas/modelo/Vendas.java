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
public class Vendas implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "codigo")
    private String codigo;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "usuarios_id")
    private Long usuariosId;

    @Column(name = "clientes_id")
    private Long clientesId;

    @Column(name = "caixas_id")
    private Long caixasId;

    @Column(name = "cupons_id")
    private Long cuponsId;

    @Column(name = "cancelador_id")
    private Long canceladorId;

    @Column(name = "data_cancelamento")
    private Timestamp dataCancelamento;

    @Column(name = "data_prepedido")
    private Timestamp dataPrepedido;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "datahora")
    private Timestamp datahora;

    @Column(name = "data_entrada")
    private Timestamp dataEntrada;

    @Column(name = "data_saida")
    private Timestamp dataSaida;

    @Column(name = "valor_total")
    private double valorTotal;

    @Column(name = "valor_pago")
    private double valorPago;

    @Column(name = "pagamentos_vista")
    private boolean pagamentosVista;

    @Column(name = "pagamentos_prazo")
    private String pagamentosPrazo;

    @Column(name = "pagamentos_vale")
    private String pagamentosVale;

    @Column(name = "valor_devolucoes")
    private double valorDevolucoes;

    @Column(name = "valor_comissao")
    private boolean valorComissao;

    @Column(name = "valor_taxas")
    private double valorTaxas;

    @Column(name = "valor_custos")
    private double valorCustos;

    @Column(name = "valor_adicionais")
    private boolean valorAdicionais;

    @Column(name = "valor_vale_presente")
    private double valorValePresente;

    @Column(name = "valor_descontos")
    private double valorDescontos;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "validade_orcamento")
    private String validadeOrcamento;

    @Column(name = "local")
    private String local;

    @Column(name = "entrega")
    private String entrega;

    @Column(name = "endereco")
    private String endereco;

    @Column(name = "cep")
    private String cep;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "uf")
    private String uf;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "quem_recebe")
    private String quemRecebe;

    @Column(name = "is_catalogo")
    private boolean isCatalogo;

    @Column(name = "forma_pagamento_catalogo")
    private String formaPagamentoCatalogo;

    @Column(name = "troco_catalogo")
    private String trocoCatalogo;

    @Column(name = "telefone_catalogo")
    private String telefoneCatalogo;

    @Column(name = "origem")
    private String origem;

    @Column(name = "campos_personalizados")
    private String camposPersonalizados;

    @Column(name = "numero_os")
    private String numeroOs;

    @Column(name = "is_os_rapida")
    private boolean isOsRapida;

    @Column(name = "finalizada_os")
    private String finalizadaOs;

    @Column(name = "entregue_os")
    private String entregueOs;

    @Column(name = "entregadores_id")
    private Long entregadoresId;

    @Column(name = "data_entregue")
    private Timestamp dataEntregue;

    @Column(name = "ativo")
    private boolean ativo;

    @Column(name = "status_venda_id")
    private Long statusVendaId;

    @Column(name = "clientes_nome")
    private String clientesNome;

}
