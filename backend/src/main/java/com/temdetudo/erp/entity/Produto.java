package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produtos")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sku;

    @Column(name = "codigo_barras")
    private String codigoBarras;

    private String nome;

    private String categoria;

    private String unidade;

    private BigDecimal custo;

    @Column(name = "custo_compra")
    private BigDecimal custoCompra;

    @Column(name = "custo_medio")
    private BigDecimal custoMedio;

    private BigDecimal preco;

    @Column(name = "preco_atacado")
    private BigDecimal precoAtacado;

    @Column(name = "preco_promocional")
    private BigDecimal precoPromocional;

    @Column(name = "desconto_percentual")
    private BigDecimal descontoPercentual;

    private BigDecimal estoque;

    @Column(name = "estoque_minimo")
    private BigDecimal estoqueMinimo;

    @Column(name = "estoque_maximo")
    private BigDecimal estoqueMaximo;

    private BigDecimal peso;

    @Column(name = "local_id")
    private Integer localId;

    private String localizacao;

    @Column(name = "marca_id")
    private Integer marcaId;

    @Column(name = "fornecedor_id")
    private Long fornecedorId;

    private String ncm;

    private String cest;

    @Column(name = "produto_producao")
    private Boolean produtoProducao;

    @Column(name = "consome_estoque")
    private Boolean consomeEstoque;

    private Boolean ativo;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(length = 500)
    private String imagem;

    @Column(columnDefinition = "LONGTEXT")
    private String midia;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    public Produto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public BigDecimal getCusto() {
        return custo;
    }

    public void setCusto(BigDecimal custo) {
        this.custo = custo;
    }

    public BigDecimal getCustoCompra() {
        return custoCompra;
    }

    public void setCustoCompra(BigDecimal custoCompra) {
        this.custoCompra = custoCompra;
    }

    public BigDecimal getCustoMedio() {
        return custoMedio;
    }

    public void setCustoMedio(BigDecimal custoMedio) {
        this.custoMedio = custoMedio;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public void setPreco(BigDecimal preco) {
        this.preco = preco;
    }

    public BigDecimal getPrecoAtacado() {
        return precoAtacado;
    }

    public void setPrecoAtacado(BigDecimal precoAtacado) {
        this.precoAtacado = precoAtacado;
    }

    public BigDecimal getPrecoPromocional() {
        return precoPromocional;
    }

    public void setPrecoPromocional(BigDecimal precoPromocional) {
        this.precoPromocional = precoPromocional;
    }

    public BigDecimal getDescontoPercentual() {
        return descontoPercentual;
    }

    public void setDescontoPercentual(BigDecimal descontoPercentual) {
        this.descontoPercentual = descontoPercentual;
    }

    public BigDecimal getEstoque() {
        return estoque;
    }

    public void setEstoque(BigDecimal estoque) {
        this.estoque = estoque;
    }

    public BigDecimal getEstoqueMinimo() {
        return estoqueMinimo;
    }

    public void setEstoqueMinimo(BigDecimal estoqueMinimo) {
        this.estoqueMinimo = estoqueMinimo;
    }

    public BigDecimal getEstoqueMaximo() {
        return estoqueMaximo;
    }

    public void setEstoqueMaximo(BigDecimal estoqueMaximo) {
        this.estoqueMaximo = estoqueMaximo;
    }

    public BigDecimal getPeso() {
        return peso;
    }

    public void setPeso(BigDecimal peso) {
        this.peso = peso;
    }

    public Integer getLocalId() {
        return localId;
    }

    public void setLocalId(Integer localId) {
        this.localId = localId;
    }

    public String getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(String localizacao) {
        this.localizacao = localizacao;
    }

    public Integer getMarcaId() {
        return marcaId;
    }

    public void setMarcaId(Integer marcaId) {
        this.marcaId = marcaId;
    }

    public Long getFornecedorId() {
        return fornecedorId;
    }

    public void setFornecedorId(Long fornecedorId) {
        this.fornecedorId = fornecedorId;
    }

    public String getNcm() {
        return ncm;
    }

    public void setNcm(String ncm) {
        this.ncm = ncm;
    }

    public String getCest() {
        return cest;
    }

    public void setCest(String cest) {
        this.cest = cest;
    }

    public Boolean getProdutoProducao() {
        return produtoProducao;
    }

    public void setProdutoProducao(Boolean produtoProducao) {
        this.produtoProducao = produtoProducao;
    }

    public Boolean getConsomeEstoque() {
        return consomeEstoque;
    }

    public void setConsomeEstoque(Boolean consomeEstoque) {
        this.consomeEstoque = consomeEstoque;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public String getMidia() {
        return midia;
    }

    public void setMidia(String midia) {
        this.midia = midia;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}