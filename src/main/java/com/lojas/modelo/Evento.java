package com.lojas.modelo;

import java.io.Serializable;
import java.sql.Timestamp;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Scope;
import org.springframework.format.annotation.DateTimeFormat;

@Log4j2
@Setter
@Getter
@Table(name = "eventos")
@Entity
@Scope("singleton")
public class Evento implements Serializable {

    @Id
    @NotNull
    @Column(name = "id")
    private long id;
    @Column(name = "DataHoraInicio")
    private Timestamp dataHoraInicio;
    @Column(name = "DataHoraFim")
    private Timestamp dataHoraFim;
    @Column(name = "fkComandante")
    private String idComandante;
    @OneToOne(mappedBy = "evento")
    private Andamento andamento;
    @Column(name = "Brigada")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp brigada;
    @Column(name = "Baleeira_1_3")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp baleeira_1_3;
    @Column(name = "Baleeira_2_4")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp baleeira_2_4;
    @Column(name = "FT_Manutenção")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp ftManutencao;
    @Column(name = "FT_Operação")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp ftOperacao;
    @Column(name = "Socorrista")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp socorrista;
    @Column(name = "Abandono")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp abandono;
    @Column(name = "Cinema")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp cinema;
    @Column(name = "Refeitório")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp refeitorio;
    @Column(name = "CCR")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp ccr;
    @Transient
    private boolean emAndamento = false;

    public Evento() {
    }

    public Evento(long id) {

        this.id = id;
    }

    public Evento(long id, Timestamp dataHoraInicio, Timestamp dataHoraFim,
            String idComandante, Timestamp brigada, Timestamp baleeira_1_3,
            Timestamp baleeira_2_4, Timestamp ftManutencao, Timestamp ftOperacao,
            Timestamp cinema, Timestamp refeitorio, Timestamp ccr,
            Timestamp socorrista, Timestamp abandono) {

        this.id = id;
        this.dataHoraInicio = dataHoraInicio;
        this.dataHoraFim = dataHoraFim;
        this.idComandante = idComandante;
        this.brigada = brigada;
        this.baleeira_1_3 = baleeira_1_3;
        this.baleeira_2_4 = baleeira_2_4;
        this.ftManutencao = ftManutencao;
        this.ftOperacao = ftOperacao;
        this.cinema = cinema;
        this.refeitorio = refeitorio;
        this.ccr = ccr;
        this.socorrista = socorrista;
        this.abandono = abandono;
    }
}
