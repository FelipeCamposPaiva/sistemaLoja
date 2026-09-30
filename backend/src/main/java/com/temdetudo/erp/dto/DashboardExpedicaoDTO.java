package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardExpedicaoDTO {

    private long separar;
    private long separando;
    private long parciais;
    private long embalar;
    private long aguardandoColeta;
    private long emTransporte;
    private long entreguesHoje;
    private List<Grupo> transportadoras = new ArrayList<>();
    private List<PedidoLinha> pedidos = new ArrayList<>();

    public long getSeparar() { return separar; }
    public void setSeparar(long separar) { this.separar = separar; }
    public long getSeparando() { return separando; }
    public void setSeparando(long separando) { this.separando = separando; }
    public long getParciais() { return parciais; }
    public void setParciais(long parciais) { this.parciais = parciais; }
    public long getEmbalar() { return embalar; }
    public void setEmbalar(long embalar) { this.embalar = embalar; }
    public long getAguardandoColeta() { return aguardandoColeta; }
    public void setAguardandoColeta(long aguardandoColeta) { this.aguardandoColeta = aguardandoColeta; }
    public long getEmTransporte() { return emTransporte; }
    public void setEmTransporte(long emTransporte) { this.emTransporte = emTransporte; }
    public long getEntreguesHoje() { return entreguesHoje; }
    public void setEntreguesHoje(long entreguesHoje) { this.entreguesHoje = entreguesHoje; }
    public List<Grupo> getTransportadoras() { return transportadoras; }
    public void setTransportadoras(List<Grupo> transportadoras) { this.transportadoras = transportadoras; }
    public List<PedidoLinha> getPedidos() { return pedidos; }
    public void setPedidos(List<PedidoLinha> pedidos) { this.pedidos = pedidos; }

    public static class Grupo {
        private String nome;
        private long aguardandoColeta;
        private long emTransporte;
        private long separar;
        private long total;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public long getAguardandoColeta() { return aguardandoColeta; }
        public void setAguardandoColeta(long aguardandoColeta) { this.aguardandoColeta = aguardandoColeta; }
        public long getEmTransporte() { return emTransporte; }
        public void setEmTransporte(long emTransporte) { this.emTransporte = emTransporte; }
        public long getSeparar() { return separar; }
        public void setSeparar(long separar) { this.separar = separar; }
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
    }

    public static class PedidoLinha {
        private Integer id;
        private String numero;
        private String cliente;
        private String origem;
        private String formaEnvio;
        private String rastreio;
        private String etapa;
        private String separacao;
        private String expedicao;
        private String embalagem;
        private String status;
        private boolean parcial;
        private int itens;
        private int itensSeparados;
        private int pctSeparacao;
        private BigDecimal valor = BigDecimal.ZERO;
        private String dataPedido;
        private String dataLimiteDespacho;

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getNumero() { return numero; }
        public void setNumero(String numero) { this.numero = numero; }
        public String getCliente() { return cliente; }
        public void setCliente(String cliente) { this.cliente = cliente; }
        public String getOrigem() { return origem; }
        public void setOrigem(String origem) { this.origem = origem; }
        public String getFormaEnvio() { return formaEnvio; }
        public void setFormaEnvio(String formaEnvio) { this.formaEnvio = formaEnvio; }
        public String getRastreio() { return rastreio; }
        public void setRastreio(String rastreio) { this.rastreio = rastreio; }
        public String getEtapa() { return etapa; }
        public void setEtapa(String etapa) { this.etapa = etapa; }
        public String getSeparacao() { return separacao; }
        public void setSeparacao(String separacao) { this.separacao = separacao; }
        public String getExpedicao() { return expedicao; }
        public void setExpedicao(String expedicao) { this.expedicao = expedicao; }
        public String getEmbalagem() { return embalagem; }
        public void setEmbalagem(String embalagem) { this.embalagem = embalagem; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public boolean isParcial() { return parcial; }
        public void setParcial(boolean parcial) { this.parcial = parcial; }
        public int getItens() { return itens; }
        public void setItens(int itens) { this.itens = itens; }
        public int getItensSeparados() { return itensSeparados; }
        public void setItensSeparados(int itensSeparados) { this.itensSeparados = itensSeparados; }
        public int getPctSeparacao() { return pctSeparacao; }
        public void setPctSeparacao(int pctSeparacao) { this.pctSeparacao = pctSeparacao; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
        public String getDataPedido() { return dataPedido; }
        public void setDataPedido(String dataPedido) { this.dataPedido = dataPedido; }
        public String getDataLimiteDespacho() { return dataLimiteDespacho; }
        public void setDataLimiteDespacho(String dataLimiteDespacho) { this.dataLimiteDespacho = dataLimiteDespacho; }
    }
}
