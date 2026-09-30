package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BalanceteDTO {

    private int ano;
    private int mes;
    private String competencia;
    private String regime;
    private List<Linha> receitas = new ArrayList<>();
    private List<Linha> despesas = new ArrayList<>();
    private List<Dre> dre = new ArrayList<>();
    private BigDecimal totalDebito = BigDecimal.ZERO;
    private BigDecimal totalCredito = BigDecimal.ZERO;
    private BigDecimal resultado = BigDecimal.ZERO;
    private int lancamentos;

    public int getAno() {
        return ano;
    }

    public void setAno(int ano) {
        this.ano = ano;
    }

    public int getMes() {
        return mes;
    }

    public void setMes(int mes) {
        this.mes = mes;
    }

    public String getCompetencia() {
        return competencia;
    }

    public void setCompetencia(String competencia) {
        this.competencia = competencia;
    }

    public String getRegime() {
        return regime;
    }

    public void setRegime(String regime) {
        this.regime = regime;
    }

    public List<Linha> getReceitas() {
        return receitas;
    }

    public void setReceitas(List<Linha> receitas) {
        this.receitas = receitas;
    }

    public List<Linha> getDespesas() {
        return despesas;
    }

    public void setDespesas(List<Linha> despesas) {
        this.despesas = despesas;
    }

    public List<Dre> getDre() {
        return dre;
    }

    public void setDre(List<Dre> dre) {
        this.dre = dre;
    }

    public BigDecimal getTotalDebito() {
        return totalDebito;
    }

    public void setTotalDebito(BigDecimal totalDebito) {
        this.totalDebito = totalDebito;
    }

    public BigDecimal getTotalCredito() {
        return totalCredito;
    }

    public void setTotalCredito(BigDecimal totalCredito) {
        this.totalCredito = totalCredito;
    }

    public BigDecimal getResultado() {
        return resultado;
    }

    public void setResultado(BigDecimal resultado) {
        this.resultado = resultado;
    }

    public int getLancamentos() {
        return lancamentos;
    }

    public void setLancamentos(int lancamentos) {
        this.lancamentos = lancamentos;
    }

    public static class Linha {
        private String codigo;
        private String nome;
        private String tipo;
        private String dreGrupo;
        private BigDecimal debito = BigDecimal.ZERO;
        private BigDecimal credito = BigDecimal.ZERO;
        private BigDecimal saldo = BigDecimal.ZERO;
        private int lancamentos;

        public String getCodigo() {
            return codigo;
        }

        public void setCodigo(String codigo) {
            this.codigo = codigo;
        }

        public String getNome() {
            return nome;
        }

        public void setNome(String nome) {
            this.nome = nome;
        }

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        public String getDreGrupo() {
            return dreGrupo;
        }

        public void setDreGrupo(String dreGrupo) {
            this.dreGrupo = dreGrupo;
        }

        public BigDecimal getDebito() {
            return debito;
        }

        public void setDebito(BigDecimal debito) {
            this.debito = debito;
        }

        public BigDecimal getCredito() {
            return credito;
        }

        public void setCredito(BigDecimal credito) {
            this.credito = credito;
        }

        public BigDecimal getSaldo() {
            return saldo;
        }

        public void setSaldo(BigDecimal saldo) {
            this.saldo = saldo;
        }

        public int getLancamentos() {
            return lancamentos;
        }

        public void setLancamentos(int lancamentos) {
            this.lancamentos = lancamentos;
        }
    }

    public static class Dre {
        private String grupo;
        private BigDecimal valor = BigDecimal.ZERO;

        public Dre() {
        }

        public Dre(String grupo, BigDecimal valor) {
            this.grupo = grupo;
            this.valor = valor;
        }

        public String getGrupo() {
            return grupo;
        }

        public void setGrupo(String grupo) {
            this.grupo = grupo;
        }

        public BigDecimal getValor() {
            return valor;
        }

        public void setValor(BigDecimal valor) {
            this.valor = valor;
        }
    }
}
