package com.lojas.modelo;

import jakarta.persistence.*;
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
    private Long usuariosId;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "usuarios_id_fechamento")
    private Long usuariosIdFechamento;

    @Column(name = "data_abertura")
    private Timestamp dataAbertura;

    @Column(name = "data_fechamento")
    private Timestamp dataFechamento;

    @Column(name = "valor_abertura")
    private Double valorAbertura;

    @Column(name = "valor_fechamento")
    private Double valorFechamento;

    @Column(name = "inconsistencia")
    private Float inconsistencia;

    @Column(name = "abertura_conta_caixa_gerencial_id")
    private Float aberturaContaCaixaGerencialId;

    @Column(name = "fechamento_conta_caixa_gerencial_id")
    private Float fechamentoContaCaixaGerencialId;

    @Column(name = "movimentado")
    private Long movimentado;

    @Column(name = "ativo")
    private Long ativo;

    @Column(name = "usuarios_nome")
    private String usuariosNome;

}
