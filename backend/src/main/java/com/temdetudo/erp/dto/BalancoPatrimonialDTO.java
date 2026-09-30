package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BalancoPatrimonialDTO {

    private int ano;
    private int mes;
    private BalancoMes competencia;
    private BalancoMes anterior;
    private List<BalancoMes> serie = new ArrayList<>();
    private DestinoLucro destino = new DestinoLucro();
    private List<Linha> ativo = new ArrayList<>();
    private List<Linha> passivo = new ArrayList<>();
    private List<Linha> patrimonio = new ArrayList<>();

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

    public BalancoMes getCompetencia() {
        return competencia;
    }

    public void setCompetencia(BalancoMes competencia) {
        this.competencia = competencia;
    }

    public BalancoMes getAnterior() {
        return anterior;
    }

    public void setAnterior(BalancoMes anterior) {
        this.anterior = anterior;
    }

    public List<BalancoMes> getSerie() {
        return serie;
    }

    public void setSerie(List<BalancoMes> serie) {
        this.serie = serie;
    }

    public DestinoLucro getDestino() {
        return destino;
    }

    public void setDestino(DestinoLucro destino) {
        this.destino = destino;
    }

    public List<Linha> getAtivo() {
        return ativo;
    }

    public void setAtivo(List<Linha> ativo) {
        this.ativo = ativo;
    }

    public List<Linha> getPassivo() {
        return passivo;
    }

    public void setPassivo(List<Linha> passivo) {
        this.passivo = passivo;
    }

    public List<Linha> getPatrimonio() {
        return patrimonio;
    }

    public void setPatrimonio(List<Linha> patrimonio) {
        this.patrimonio = patrimonio;
    }

    public static class Linha {
        private String id;
        private String nome;
        private String grupo;
        private BigDecimal valor = BigDecimal.ZERO;
        private BigDecimal anterior = BigDecimal.ZERO;

        public Linha() {
        }

        public Linha(String id, String nome, String grupo, BigDecimal valor, BigDecimal anterior) {
            this.id = id;
            this.nome = nome;
            this.grupo = grupo;
            this.valor = valor;
            this.anterior = anterior;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getNome() {
            return nome;
        }

        public void setNome(String nome) {
            this.nome = nome;
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

        public BigDecimal getAnterior() {
            return anterior;
        }

        public void setAnterior(BigDecimal anterior) {
            this.anterior = anterior;
        }
    }

    public static class BalancoMes {
        private String competencia;
        private String rotulo;
        private BigDecimal caixa = BigDecimal.ZERO;
        private BigDecimal contasReceber = BigDecimal.ZERO;
        private BigDecimal estoque = BigDecimal.ZERO;
        private BigDecimal imobilizado = BigDecimal.ZERO;
        private BigDecimal ativo = BigDecimal.ZERO;
        private BigDecimal contasPagar = BigDecimal.ZERO;
        private BigDecimal passivo = BigDecimal.ZERO;
        private BigDecimal patrimonioLiquido = BigDecimal.ZERO;
        private BigDecimal dreMes = BigDecimal.ZERO;
        private BigDecimal dreAcumulado = BigDecimal.ZERO;

        public String getCompetencia() {
            return competencia;
        }

        public void setCompetencia(String competencia) {
            this.competencia = competencia;
        }

        public String getRotulo() {
            return rotulo;
        }

        public void setRotulo(String rotulo) {
            this.rotulo = rotulo;
        }

        public BigDecimal getCaixa() {
            return caixa;
        }

        public void setCaixa(BigDecimal caixa) {
            this.caixa = caixa;
        }

        public BigDecimal getContasReceber() {
            return contasReceber;
        }

        public void setContasReceber(BigDecimal contasReceber) {
            this.contasReceber = contasReceber;
        }

        public BigDecimal getEstoque() {
            return estoque;
        }

        public void setEstoque(BigDecimal estoque) {
            this.estoque = estoque;
        }

        public BigDecimal getImobilizado() {
            return imobilizado;
        }

        public void setImobilizado(BigDecimal imobilizado) {
            this.imobilizado = imobilizado;
        }

        public BigDecimal getAtivo() {
            return ativo;
        }

        public void setAtivo(BigDecimal ativo) {
            this.ativo = ativo;
        }

        public BigDecimal getContasPagar() {
            return contasPagar;
        }

        public void setContasPagar(BigDecimal contasPagar) {
            this.contasPagar = contasPagar;
        }

        public BigDecimal getPassivo() {
            return passivo;
        }

        public void setPassivo(BigDecimal passivo) {
            this.passivo = passivo;
        }

        public BigDecimal getPatrimonioLiquido() {
            return patrimonioLiquido;
        }

        public void setPatrimonioLiquido(BigDecimal patrimonioLiquido) {
            this.patrimonioLiquido = patrimonioLiquido;
        }

        public BigDecimal getDreMes() {
            return dreMes;
        }

        public void setDreMes(BigDecimal dreMes) {
            this.dreMes = dreMes;
        }

        public BigDecimal getDreAcumulado() {
            return dreAcumulado;
        }

        public void setDreAcumulado(BigDecimal dreAcumulado) {
            this.dreAcumulado = dreAcumulado;
        }
    }

    public static class DestinoLucro {
        private BigDecimal lucroMes = BigDecimal.ZERO;
        private BigDecimal caixa = BigDecimal.ZERO;
        private BigDecimal estoque = BigDecimal.ZERO;
        private BigDecimal imobilizado = BigDecimal.ZERO;
        private BigDecimal contasReceber = BigDecimal.ZERO;
        private BigDecimal contasPagar = BigDecimal.ZERO;
        private String resumo;

        public BigDecimal getLucroMes() {
            return lucroMes;
        }

        public void setLucroMes(BigDecimal lucroMes) {
            this.lucroMes = lucroMes;
        }

        public BigDecimal getCaixa() {
            return caixa;
        }

        public void setCaixa(BigDecimal caixa) {
            this.caixa = caixa;
        }

        public BigDecimal getEstoque() {
            return estoque;
        }

        public void setEstoque(BigDecimal estoque) {
            this.estoque = estoque;
        }

        public BigDecimal getImobilizado() {
            return imobilizado;
        }

        public void setImobilizado(BigDecimal imobilizado) {
            this.imobilizado = imobilizado;
        }

        public BigDecimal getContasReceber() {
            return contasReceber;
        }

        public void setContasReceber(BigDecimal contasReceber) {
            this.contasReceber = contasReceber;
        }

        public BigDecimal getContasPagar() {
            return contasPagar;
        }

        public void setContasPagar(BigDecimal contasPagar) {
            this.contasPagar = contasPagar;
        }

        public String getResumo() {
            return resumo;
        }

        public void setResumo(String resumo) {
            this.resumo = resumo;
        }
    }
}
