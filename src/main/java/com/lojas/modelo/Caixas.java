package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import java.sql.Timestamp;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class Caixas implements Serializable {
    @Column(name = "id")
    @Id
    private long id;

    @Column(name = "usuarios_id")
    private long usuariosId;

    @Column(name = "empresas_id")
    private long empresasId;

    @Column(name = "usuarios_id_fechamento")
    private String usuariosIdFechamento;

    @Column(name = "data_abertura")
    private Timestamp dataAbertura;

    @Column(name = "data_fechamento")
    private Timestamp dataFechamento;

    @Column(name = "valor_abertura")
    private double valorAbertura;

    @Column(name = "valor_fechamento")
    private double valorFechamento;

    @Column(name = "inconsistencia")
    private boolean inconsistencia;

    @Column(name = "abertura_conta_caixa_gerencial_id")
    private long aberturaContaCaixaGerencialId;

    @Column(name = "fechamento_conta_caixa_gerencial_id")
    private long fechamentoContaCaixaGerencialId;

    @Column(name = "movimentado")
    private String movimentado;

    @Column(name = "ativo")
    private boolean ativo;

    @Column(name = "usuarios_nome")
    private String usuariosNome;

}
