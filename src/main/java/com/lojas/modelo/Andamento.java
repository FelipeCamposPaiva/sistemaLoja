package com.lojas.modelo;

import com.lojas.modelo.classId.AndamentoId;
import java.io.Serializable;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.IdClass;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;

@Log4j2
@Setter
@Getter
@Table(name = "andamento")
@Entity
@IdClass(AndamentoId.class)
public class Andamento implements Serializable {

    @Id
    @Column(name = "idEvento")
    private long idEvento;
    @Id
    @Column(name = "idPessoa")
    private String idPessoa;
    @Column(name = "horario")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp horario;
    @Column(name = "IP")
    private String ip;

    /*Muitos Andamentos para uma Pessoas
    Um andamento possui apenas uma pessoa, porém
    uma pessoa pode estar em muitos Andamentos.*/
    @ManyToOne
    private Pessoa pessoa;
    /*Um andamento só pode ter um id de evento.
    Um evento só pode ter um id de andamento.*/
    @OneToOne
    private Evento evento;

    @Transient
    public static Map<String, Andamento> listaAndamento = new HashMap<>();

    public Andamento() {
    }

    public Andamento(Evento evento, Pessoa pessoa, Timestamp horario, String ip) {

        this.idEvento = evento.getId();
        this.idPessoa = pessoa.getId();
        this.evento = evento;
        this.pessoa = pessoa;
        this.horario = horario;
        this.ip = ip;
    }

    @Override
    public boolean equals(Object obj) {

        if (!(obj instanceof Andamento)) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        Andamento outro = (Andamento) obj;
        if (outro.idPessoa.equals(this.idPessoa)) {
            //log.debug("Mesmo objeto");
            return true;
        }

        //log.debug("Não é mesmo objeto");
        return false;
    }

    @Override
    public int hashCode() {
        int hash = this.pessoa.getMatricula().length() + (int) this.idEvento;
        //log.debug("Hash: " + hash + " mat.: " + this.pessoa.getMatricula());
        return hash;
    }

    @Override
    public String toString() {
        return "idP_" + this.idPessoa + "_idE_" + this.idEvento;
    }

}
