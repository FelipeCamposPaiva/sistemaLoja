package com.lojas.modelo;

import java.io.Serializable;
import java.sql.Blob;
import java.sql.Timestamp;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;

@Log4j2
@Setter
@Getter
@Table(name = "cad_produtos")
@Entity
public class CadProdutos implements Serializable {

    @Id
    @Column(name = "codigo")
    private long codigo;
    @Column(name = "codprodmanual")
    private String codProdManual;
    @Column(name = "descricao")
    private String descricao;
    @Column(name = "un")
    private String un;
    @Column(name = "preco")
    private double preco;
    @Column(name = "grupodematerias")
    private String grupoDeMaterias;
    @Column(name = "grupodequimico")
    private String grupoDeQuimico;
    @Column(name = "estoqueminimo")
    private long estoqueMinimo;
    @Column(name = "ml")
    private long ml;
    @Column(name = "precodevenda")
    private double precoDeVenda;
    @Column(name = "porcentagem")
    private double porcentagem;
    @Column(name = "referencia")
    private String referencia;
    @Column(name = "fabricante")
    private String fabricante;
    @Column(name = "precoaprazo")
    private double precoAprazo;
    @Column(name = "estoqueproduto")
    private long estoqueProduto;
    @Column(name = "foradeuso")
    private boolean foraDeUso;
    @Column(name = "icms")
    private double icms;
    @Column(name = "ipi")
    private double ipi;
    @Column(name = "garantia")
    private long garantia;
    @Column(name = "fornecdorproduto")
    private String fornecedorProduto;
    @Column(name = "setor")
    private String setor;
    @Column(name = "fotoproduto")
    private Blob fotoProduto;
    @Column(name = "obs")
    private String obs;
    @Column(name = "datacadastro")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp dataCadastro;
    @Column(name = "datavalidade")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp dataValidade;
    @Column(name = "grade")
    private boolean grade;
    @Column(name = "sel")
    private boolean sel;
    @Column(name = "verificactrlest")
    private boolean verificactrlest;
    @Column(name = "atualizadoem")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp atualizadoEm;
    @Column(name = "tblprecos")
    private boolean tblPrecos;

    public CadProdutos() {
    }

    public CadProdutos(long codigo, String codProdManual, String descricao, String un, double preco, String grupoDeMaterias, String grupoDeQuimico, long estoqueMinimo, long ml,
            double precoDeVenda, double porcentagem, String referencia, String fabricante, double precoAprazo, long estoqueProduto, boolean foraDeUso, double icms, double ipi, long garantia, String fornecedorProduto,
            String setor, Blob fotoProduto, String obs, Timestamp dataCadastro, Timestamp dataValidade, boolean grade, boolean sel, boolean verificactrlest, Timestamp atualizadoEm, boolean tblPrecos) {

        this.codigo = codigo;
        this.codigo = codigo;
        this.codProdManual = codProdManual;
        this.descricao = descricao;
        this.un = un;
        this.preco = preco;
        this.grupoDeMaterias = grupoDeMaterias;
        this.grupoDeQuimico = grupoDeQuimico;
        this.estoqueMinimo = estoqueMinimo;
        this.ml = ml;
        this.precoDeVenda = precoDeVenda;
        this.porcentagem = porcentagem;
        this.referencia = referencia;
        this.fabricante = fabricante;
        this.precoAprazo = precoAprazo;
        this.estoqueProduto = estoqueProduto;
        this.foraDeUso = foraDeUso;
        this.icms = icms;
        this.ipi = ipi;
        this.garantia = garantia;
        this.fornecedorProduto = fornecedorProduto;
        this.setor = setor;
        this.fotoProduto = fotoProduto;
        this.obs = obs;
        this.dataCadastro = dataCadastro;
        this.dataValidade = dataValidade;
        this.grade = grade;
        this.sel = sel;
        this.verificactrlest = verificactrlest;
        this.atualizadoEm = atualizadoEm;
        this.tblPrecos = tblPrecos;

    }
}
