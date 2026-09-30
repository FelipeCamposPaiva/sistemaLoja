package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardSuprimentosDTO {

    private BigDecimal valorCusto = BigDecimal.ZERO;
    private BigDecimal valorVenda = BigDecimal.ZERO;
    private BigDecimal margemPercentual = BigDecimal.ZERO;
    private long skuAtivos;
    private long skuComEstoque;
    private long skuReposicao;
    private List<Grupo> porMarca = new ArrayList<>();
    private List<Grupo> porFornecedor = new ArrayList<>();
    private List<Grupo> margensMarca = new ArrayList<>();
    private List<Ponto> reposicoesAno = new ArrayList<>();
    private List<ProdutoLinha> produtos = new ArrayList<>();
    private List<ProdutoLinha> reposicao = new ArrayList<>();
    private VendasPeriodo vendas = new VendasPeriodo();
    private List<ProdutoLinha> maisVendidos = new ArrayList<>();

    public BigDecimal getValorCusto() { return valorCusto; }
    public void setValorCusto(BigDecimal valorCusto) { this.valorCusto = valorCusto; }
    public BigDecimal getValorVenda() { return valorVenda; }
    public void setValorVenda(BigDecimal valorVenda) { this.valorVenda = valorVenda; }
    public BigDecimal getMargemPercentual() { return margemPercentual; }
    public void setMargemPercentual(BigDecimal margemPercentual) { this.margemPercentual = margemPercentual; }
    public long getSkuAtivos() { return skuAtivos; }
    public void setSkuAtivos(long skuAtivos) { this.skuAtivos = skuAtivos; }
    public long getSkuComEstoque() { return skuComEstoque; }
    public void setSkuComEstoque(long skuComEstoque) { this.skuComEstoque = skuComEstoque; }
    public long getSkuReposicao() { return skuReposicao; }
    public void setSkuReposicao(long skuReposicao) { this.skuReposicao = skuReposicao; }
    public List<Grupo> getPorMarca() { return porMarca; }
    public void setPorMarca(List<Grupo> porMarca) { this.porMarca = porMarca; }
    public List<Grupo> getPorFornecedor() { return porFornecedor; }
    public void setPorFornecedor(List<Grupo> porFornecedor) { this.porFornecedor = porFornecedor; }
    public List<Grupo> getMargensMarca() { return margensMarca; }
    public void setMargensMarca(List<Grupo> margensMarca) { this.margensMarca = margensMarca; }
    public List<Ponto> getReposicoesAno() { return reposicoesAno; }
    public void setReposicoesAno(List<Ponto> reposicoesAno) { this.reposicoesAno = reposicoesAno; }
    public List<ProdutoLinha> getProdutos() { return produtos; }
    public void setProdutos(List<ProdutoLinha> produtos) { this.produtos = produtos; }
    public List<ProdutoLinha> getReposicao() { return reposicao; }
    public void setReposicao(List<ProdutoLinha> reposicao) { this.reposicao = reposicao; }
    public VendasPeriodo getVendas() { return vendas; }
    public void setVendas(VendasPeriodo vendas) { this.vendas = vendas; }
    public List<ProdutoLinha> getMaisVendidos() { return maisVendidos; }
    public void setMaisVendidos(List<ProdutoLinha> maisVendidos) { this.maisVendidos = maisVendidos; }

    public static class Grupo {
        private String nome;
        private BigDecimal quantidade = BigDecimal.ZERO;
        private BigDecimal valorCusto = BigDecimal.ZERO;
        private BigDecimal valorVenda = BigDecimal.ZERO;
        private BigDecimal margemPercentual = BigDecimal.ZERO;
        private long itens;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public BigDecimal getQuantidade() { return quantidade; }
        public void setQuantidade(BigDecimal quantidade) { this.quantidade = quantidade; }
        public BigDecimal getValorCusto() { return valorCusto; }
        public void setValorCusto(BigDecimal valorCusto) { this.valorCusto = valorCusto; }
        public BigDecimal getValorVenda() { return valorVenda; }
        public void setValorVenda(BigDecimal valorVenda) { this.valorVenda = valorVenda; }
        public BigDecimal getMargemPercentual() { return margemPercentual; }
        public void setMargemPercentual(BigDecimal margemPercentual) { this.margemPercentual = margemPercentual; }
        public long getItens() { return itens; }
        public void setItens(long itens) { this.itens = itens; }
    }

    public static class Ponto {
        private String mes;
        private String rotulo;
        private BigDecimal quantidade = BigDecimal.ZERO;
        private BigDecimal valor = BigDecimal.ZERO;

        public String getMes() { return mes; }
        public void setMes(String mes) { this.mes = mes; }
        public String getRotulo() { return rotulo; }
        public void setRotulo(String rotulo) { this.rotulo = rotulo; }
        public BigDecimal getQuantidade() { return quantidade; }
        public void setQuantidade(BigDecimal quantidade) { this.quantidade = quantidade; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
    }

    public static class ProdutoLinha {
        private Long id;
        private String sku;
        private String nome;
        private String marca;
        private String fornecedor;
        private Long fornecedorId;
        private String localizacao;
        private BigDecimal estoque = BigDecimal.ZERO;
        private BigDecimal estoqueMinimo = BigDecimal.ZERO;
        private BigDecimal custo = BigDecimal.ZERO;
        private BigDecimal preco = BigDecimal.ZERO;
        private BigDecimal valorCusto = BigDecimal.ZERO;
        private BigDecimal valorVenda = BigDecimal.ZERO;
        private BigDecimal margemPercentual = BigDecimal.ZERO;
        private BigDecimal comprar = BigDecimal.ZERO;
        private BigDecimal qtd15 = BigDecimal.ZERO;
        private BigDecimal qtd30 = BigDecimal.ZERO;
        private BigDecimal qtd45 = BigDecimal.ZERO;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public String getMarca() { return marca; }
        public void setMarca(String marca) { this.marca = marca; }
        public String getFornecedor() { return fornecedor; }
        public void setFornecedor(String fornecedor) { this.fornecedor = fornecedor; }
        public Long getFornecedorId() { return fornecedorId; }
        public void setFornecedorId(Long fornecedorId) { this.fornecedorId = fornecedorId; }
        public String getLocalizacao() { return localizacao; }
        public void setLocalizacao(String localizacao) { this.localizacao = localizacao; }
        public BigDecimal getEstoque() { return estoque; }
        public void setEstoque(BigDecimal estoque) { this.estoque = estoque; }
        public BigDecimal getEstoqueMinimo() { return estoqueMinimo; }
        public void setEstoqueMinimo(BigDecimal estoqueMinimo) { this.estoqueMinimo = estoqueMinimo; }
        public BigDecimal getCusto() { return custo; }
        public void setCusto(BigDecimal custo) { this.custo = custo; }
        public BigDecimal getPreco() { return preco; }
        public void setPreco(BigDecimal preco) { this.preco = preco; }
        public BigDecimal getValorCusto() { return valorCusto; }
        public void setValorCusto(BigDecimal valorCusto) { this.valorCusto = valorCusto; }
        public BigDecimal getValorVenda() { return valorVenda; }
        public void setValorVenda(BigDecimal valorVenda) { this.valorVenda = valorVenda; }
        public BigDecimal getMargemPercentual() { return margemPercentual; }
        public void setMargemPercentual(BigDecimal margemPercentual) { this.margemPercentual = margemPercentual; }
        public BigDecimal getComprar() { return comprar; }
        public void setComprar(BigDecimal comprar) { this.comprar = comprar; }
        public BigDecimal getQtd15() { return qtd15; }
        public void setQtd15(BigDecimal qtd15) { this.qtd15 = qtd15; }
        public BigDecimal getQtd30() { return qtd30; }
        public void setQtd30(BigDecimal qtd30) { this.qtd30 = qtd30; }
        public BigDecimal getQtd45() { return qtd45; }
        public void setQtd45(BigDecimal qtd45) { this.qtd45 = qtd45; }
    }

    public static class VendasPeriodo {
        private BigDecimal qtd15 = BigDecimal.ZERO;
        private BigDecimal valor15 = BigDecimal.ZERO;
        private BigDecimal qtd30 = BigDecimal.ZERO;
        private BigDecimal valor30 = BigDecimal.ZERO;
        private BigDecimal qtd45 = BigDecimal.ZERO;
        private BigDecimal valor45 = BigDecimal.ZERO;

        public BigDecimal getQtd15() { return qtd15; }
        public void setQtd15(BigDecimal qtd15) { this.qtd15 = qtd15; }
        public BigDecimal getValor15() { return valor15; }
        public void setValor15(BigDecimal valor15) { this.valor15 = valor15; }
        public BigDecimal getQtd30() { return qtd30; }
        public void setQtd30(BigDecimal qtd30) { this.qtd30 = qtd30; }
        public BigDecimal getValor30() { return valor30; }
        public void setValor30(BigDecimal valor30) { this.valor30 = valor30; }
        public BigDecimal getQtd45() { return qtd45; }
        public void setQtd45(BigDecimal qtd45) { this.qtd45 = qtd45; }
        public BigDecimal getValor45() { return valor45; }
        public void setValor45(BigDecimal valor45) { this.valor45 = valor45; }
    }
}
