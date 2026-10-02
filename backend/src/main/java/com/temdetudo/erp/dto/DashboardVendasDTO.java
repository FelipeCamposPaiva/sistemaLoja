package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardVendasDTO {

    private String periodo;
    private int dias;
    private String atualizadoEm;
    private long pedidos;
    private BigDecimal totalVendas = BigDecimal.ZERO;
    private BigDecimal totalAnterior = BigDecimal.ZERO;
    private BigDecimal variacaoVendas;
    private BigDecimal ticketMedio = BigDecimal.ZERO;
    private BigDecimal ticketAnterior = BigDecimal.ZERO;
    private BigDecimal variacaoTicket;
    private BigDecimal eixoMinVendas = BigDecimal.ZERO;
    private BigDecimal eixoMaxTicket = BigDecimal.ZERO;
    private List<Ponto> serieVendas = new ArrayList<>();
    private List<Ponto> serieTicket = new ArrayList<>();
    private List<Ponto> serieDevolucoes = new ArrayList<>();
    private long vendasEcommerce;
    private long vendasFisicas;
    private long nfeEmitidas;
    private String integracaoAlta = "";
    private List<Grupo> integracoes = new ArrayList<>();
    private List<ProdutoLinha> produtos = new ArrayList<>();
    private List<Ponto> horarios = new ArrayList<>();
    private long vendasQtd;
    private long devolucoesQtd;
    private List<EstadoLinha> estados = new ArrayList<>();

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }
    public int getDias() { return dias; }
    public void setDias(int dias) { this.dias = dias; }
    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }
    public long getPedidos() { return pedidos; }
    public void setPedidos(long pedidos) { this.pedidos = pedidos; }
    public BigDecimal getTotalVendas() { return totalVendas; }
    public void setTotalVendas(BigDecimal totalVendas) { this.totalVendas = totalVendas; }
    public BigDecimal getTotalAnterior() { return totalAnterior; }
    public void setTotalAnterior(BigDecimal totalAnterior) { this.totalAnterior = totalAnterior; }
    public BigDecimal getVariacaoVendas() { return variacaoVendas; }
    public void setVariacaoVendas(BigDecimal variacaoVendas) { this.variacaoVendas = variacaoVendas; }
    public BigDecimal getTicketMedio() { return ticketMedio; }
    public void setTicketMedio(BigDecimal ticketMedio) { this.ticketMedio = ticketMedio; }
    public BigDecimal getTicketAnterior() { return ticketAnterior; }
    public void setTicketAnterior(BigDecimal ticketAnterior) { this.ticketAnterior = ticketAnterior; }
    public BigDecimal getVariacaoTicket() { return variacaoTicket; }
    public void setVariacaoTicket(BigDecimal variacaoTicket) { this.variacaoTicket = variacaoTicket; }
    public BigDecimal getEixoMinVendas() { return eixoMinVendas; }
    public void setEixoMinVendas(BigDecimal eixoMinVendas) { this.eixoMinVendas = eixoMinVendas; }
    public BigDecimal getEixoMaxTicket() { return eixoMaxTicket; }
    public void setEixoMaxTicket(BigDecimal eixoMaxTicket) { this.eixoMaxTicket = eixoMaxTicket; }
    public List<Ponto> getSerieVendas() { return serieVendas; }
    public void setSerieVendas(List<Ponto> serieVendas) { this.serieVendas = serieVendas; }
    public List<Ponto> getSerieTicket() { return serieTicket; }
    public void setSerieTicket(List<Ponto> serieTicket) { this.serieTicket = serieTicket; }
    public List<Ponto> getSerieDevolucoes() { return serieDevolucoes; }
    public void setSerieDevolucoes(List<Ponto> serieDevolucoes) { this.serieDevolucoes = serieDevolucoes; }
    public long getVendasEcommerce() { return vendasEcommerce; }
    public void setVendasEcommerce(long vendasEcommerce) { this.vendasEcommerce = vendasEcommerce; }
    public long getVendasFisicas() { return vendasFisicas; }
    public void setVendasFisicas(long vendasFisicas) { this.vendasFisicas = vendasFisicas; }
    public long getNfeEmitidas() { return nfeEmitidas; }
    public void setNfeEmitidas(long nfeEmitidas) { this.nfeEmitidas = nfeEmitidas; }
    public String getIntegracaoAlta() { return integracaoAlta; }
    public void setIntegracaoAlta(String integracaoAlta) { this.integracaoAlta = integracaoAlta; }
    public List<Grupo> getIntegracoes() { return integracoes; }
    public void setIntegracoes(List<Grupo> integracoes) { this.integracoes = integracoes; }
    public List<ProdutoLinha> getProdutos() { return produtos; }
    public void setProdutos(List<ProdutoLinha> produtos) { this.produtos = produtos; }
    public List<Ponto> getHorarios() { return horarios; }
    public void setHorarios(List<Ponto> horarios) { this.horarios = horarios; }
    public long getVendasQtd() { return vendasQtd; }
    public void setVendasQtd(long vendasQtd) { this.vendasQtd = vendasQtd; }
    public long getDevolucoesQtd() { return devolucoesQtd; }
    public void setDevolucoesQtd(long devolucoesQtd) { this.devolucoesQtd = devolucoesQtd; }
    public List<EstadoLinha> getEstados() { return estados; }
    public void setEstados(List<EstadoLinha> estados) { this.estados = estados; }

    public static class Ponto {
        private String rotulo;
        private BigDecimal valor = BigDecimal.ZERO;
        private BigDecimal devolucoes = BigDecimal.ZERO;

        public String getRotulo() { return rotulo; }
        public void setRotulo(String rotulo) { this.rotulo = rotulo; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
        public BigDecimal getDevolucoes() { return devolucoes; }
        public void setDevolucoes(BigDecimal devolucoes) { this.devolucoes = devolucoes; }
    }

    public static class ProdutoLinha {
        private String nome;
        private BigDecimal qtd = BigDecimal.ZERO;
        private String tendencia = "FLAT";

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public BigDecimal getQtd() { return qtd; }
        public void setQtd(BigDecimal qtd) { this.qtd = qtd; }
        public String getTendencia() { return tendencia; }
        public void setTendencia(String tendencia) { this.tendencia = tendencia; }
    }

    public static class EstadoLinha {
        private String uf;
        private long pedidos;
        private BigDecimal valor = BigDecimal.ZERO;

        public String getUf() { return uf; }
        public void setUf(String uf) { this.uf = uf; }
        public long getPedidos() { return pedidos; }
        public void setPedidos(long pedidos) { this.pedidos = pedidos; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
    }

    public static class Grupo {
        private String nome;
        private long pedidos;
        private BigDecimal valor = BigDecimal.ZERO;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public long getPedidos() { return pedidos; }
        public void setPedidos(long pedidos) { this.pedidos = pedidos; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
    }
}
