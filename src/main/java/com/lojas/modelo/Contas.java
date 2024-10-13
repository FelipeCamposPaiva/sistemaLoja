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
public class Contas implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "codigo")
    private String codigo;

    @Column(name = "data_cadastro")
    private Timestamp dataCadastro;

    @Column(name = "data_conta")
    private Timestamp dataConta;

    @Column(name = "periodo")
    private String periodo;

    @Column(name = "repeticao")
    private String repeticao;

    @Column(name = "pagos")
    private String pagos;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "tipo_despesa")
    private String tipoDespesa;

    @Column(name = "valor")
    private double valor;

    @Column(name = "vendas_id")
    private Long vendasId;

    @Column(name = "clientes_id")
    private Long clientesId;

    @Column(name = "compras_id")
    private Long comprasId;

    @Column(name = "fornecedores_id")
    private Long fornecedoresId;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "is_cancelada")
    private boolean isCancelada;

    @Column(name = "origem")
    private String origem;

    @Column(name = "ativo")
    private boolean ativo;

    @Column(name = "fornecedores_nome")
    private String fornecedoresNome;

    @Column(name = "clientes_nome")
    private String clientesNome;

    @Column(name = "observacoes_venda")
    private String observacoesVenda;

    @Column(name = "vendas_codigo")
    private String vendasCodigo;

    @Column(name = "compras_codigo")
    private String comprasCodigo;

    @Column(name = "compras_nota_fiscal")
    private boolean comprasNotaFiscal;

    @Column(name = "nf_xml")
    private String nfXml;

}
