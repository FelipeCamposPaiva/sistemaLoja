package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardFinanceiroDTO {

    private String atualizadoEm;
    private BigDecimal saldoCaixa = BigDecimal.ZERO;
    private BigDecimal contasReceber = BigDecimal.ZERO;
    private BigDecimal contasPagar = BigDecimal.ZERO;
    private BigDecimal entradasMes = BigDecimal.ZERO;
    private BigDecimal saidasMes = BigDecimal.ZERO;
    private BigDecimal resultado = BigDecimal.ZERO;
    private long contasVencendoHoje;
    private String caixaMaior = "Caixa";
    private List<ContaBarra> contas = new ArrayList<>();
    private List<Ponto> fluxo = new ArrayList<>();
    private List<Aging> aging = new ArrayList<>();

    public String getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(String atualizadoEm) { this.atualizadoEm = atualizadoEm; }
    public BigDecimal getSaldoCaixa() { return saldoCaixa; }
    public void setSaldoCaixa(BigDecimal saldoCaixa) { this.saldoCaixa = saldoCaixa; }
    public BigDecimal getContasReceber() { return contasReceber; }
    public void setContasReceber(BigDecimal contasReceber) { this.contasReceber = contasReceber; }
    public BigDecimal getContasPagar() { return contasPagar; }
    public void setContasPagar(BigDecimal contasPagar) { this.contasPagar = contasPagar; }
    public BigDecimal getEntradasMes() { return entradasMes; }
    public void setEntradasMes(BigDecimal entradasMes) { this.entradasMes = entradasMes; }
    public BigDecimal getSaidasMes() { return saidasMes; }
    public void setSaidasMes(BigDecimal saidasMes) { this.saidasMes = saidasMes; }
    public BigDecimal getResultado() { return resultado; }
    public void setResultado(BigDecimal resultado) { this.resultado = resultado; }
    public long getContasVencendoHoje() { return contasVencendoHoje; }
    public void setContasVencendoHoje(long contasVencendoHoje) { this.contasVencendoHoje = contasVencendoHoje; }
    public String getCaixaMaior() { return caixaMaior; }
    public void setCaixaMaior(String caixaMaior) { this.caixaMaior = caixaMaior; }
    public List<ContaBarra> getContas() { return contas; }
    public void setContas(List<ContaBarra> contas) { this.contas = contas; }
    public List<Ponto> getFluxo() { return fluxo; }
    public void setFluxo(List<Ponto> fluxo) { this.fluxo = fluxo; }
    public List<Aging> getAging() { return aging; }
    public void setAging(List<Aging> aging) { this.aging = aging; }

    public static class ContaBarra {
        private String nome;
        private BigDecimal saldo = BigDecimal.ZERO;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public BigDecimal getSaldo() { return saldo; }
        public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }
    }

    public static class Ponto {
        private String rotulo;
        private BigDecimal valor = BigDecimal.ZERO;

        public String getRotulo() { return rotulo; }
        public void setRotulo(String rotulo) { this.rotulo = rotulo; }
        public BigDecimal getValor() { return valor; }
        public void setValor(BigDecimal valor) { this.valor = valor; }
    }

    public static class Aging {
        private String rotulo;
        private BigDecimal receber = BigDecimal.ZERO;
        private BigDecimal pagar = BigDecimal.ZERO;

        public String getRotulo() { return rotulo; }
        public void setRotulo(String rotulo) { this.rotulo = rotulo; }
        public BigDecimal getReceber() { return receber; }
        public void setReceber(BigDecimal receber) { this.receber = receber; }
        public BigDecimal getPagar() { return pagar; }
        public void setPagar(BigDecimal pagar) { this.pagar = pagar; }
    }
}
