package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos_venda")
public class PedidoVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String numero;

    @Column(name = "cliente_id")
    private Integer clienteId;

    @Column(name = "cliente_nome")
    private String clienteNome;

    @Column(name = "data_pedido")
    private LocalDateTime dataPedido;

    @Column(name = "valor_total")
    private BigDecimal valorTotal;

    private String status;

    @Column(name = "local_id")
    private Integer localId;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(length = 500)
    private String vendedor;

    private String origem;

    @Column(name = "estoque_lancado")
    private Boolean estoqueLancado;

    @Column(name = "contas_lancadas")
    private Boolean contasLancadas;

    private String separacao;

    private String expedicao;

    @Column(columnDefinition = "LONGTEXT")
    private String detalhes;

    @Column(name = "natureza_operacao_id")
    private Long naturezaOperacaoId;

    @Column(name = "natureza_operacao", length = 180)
    private String naturezaOperacao;

    @Column(length = 4)
    private String cfop;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public Integer getClienteId() {
        return clienteId;
    }

    public void setClienteId(Integer clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteNome() {
        return clienteNome;
    }

    public void setClienteNome(String clienteNome) {
        this.clienteNome = clienteNome;
    }

    public LocalDateTime getDataPedido() {
        return dataPedido;
    }

    public void setDataPedido(LocalDateTime dataPedido) {
        this.dataPedido = dataPedido;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getLocalId() {
        return localId;
    }

    public void setLocalId(Integer localId) {
        this.localId = localId;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public String getVendedor() {
        return vendedor;
    }

    public void setVendedor(String vendedor) {
        this.vendedor = vendedor;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public Boolean getEstoqueLancado() {
        return estoqueLancado;
    }

    public void setEstoqueLancado(Boolean estoqueLancado) {
        this.estoqueLancado = estoqueLancado;
    }

    public Boolean getContasLancadas() {
        return contasLancadas;
    }

    public void setContasLancadas(Boolean contasLancadas) {
        this.contasLancadas = contasLancadas;
    }

    public String getSeparacao() {
        return separacao;
    }

    public void setSeparacao(String separacao) {
        this.separacao = separacao;
    }

    public String getExpedicao() {
        return expedicao;
    }

    public void setExpedicao(String expedicao) {
        this.expedicao = expedicao;
    }

    public String getDetalhes() {
        return detalhes;
    }

    public void setDetalhes(String detalhes) {
        this.detalhes = detalhes;
    }

    public Long getNaturezaOperacaoId() {
        return naturezaOperacaoId;
    }

    public void setNaturezaOperacaoId(Long naturezaOperacaoId) {
        this.naturezaOperacaoId = naturezaOperacaoId;
    }

    public String getNaturezaOperacao() {
        return naturezaOperacao;
    }

    public void setNaturezaOperacao(String naturezaOperacao) {
        this.naturezaOperacao = naturezaOperacao;
    }

    public String getCfop() {
        return cfop;
    }

    public void setCfop(String cfop) {
        this.cfop = cfop;
    }
}
