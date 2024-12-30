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
public class Produtos implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "codigo_barras")
    private String codigoBarras;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "unid")
    private String unid;

    @Column(name = "preco_compra")
    private float precoCompra;

    @Column(name = "margem_lucro")
    private float margemLucro;

    @Column(name = "preco_venda")
    private float precoVenda;

    @Column(name = "preco_venda_2")
    private float precoVenda2;

    @Column(name = "estoque")
    private float estoque;

    @Column(name = "estoque_minimo")
    private float estoqueMinimo;

    @Column(name = "grupo")
    private String grupo;

    @Column(name = "fornecedor")
    private String fornecedor;

    @Column(name = "marca")
    private String marca;

    @Column(name = "comissao")
    private float comissao;

    @Column(name = "data_validade")
    private Timestamp dataValidade;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "controle_estoque")
    private float controleEstoque;

    @Column(name = "localizacao")
    private String localizacao;

    @Column(name = "pai_nome")
    private String paiNome;

}
