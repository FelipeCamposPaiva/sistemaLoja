package com.lojas.modelo;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;

@Setter
@Getter
@Log4j2
@Entity
@Table(name = "Erros")
public class Erro implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;
    @Column(name = "Mensagem")
    private String mensagem;
    @Column(name = "classeFinal")
    private String classeFinal;
    @Column(name = "classeOrigem")
    private String classeOrigem;
    @Column(name = "Metodo")
    private String metodo;
    @Column(name = "DataErro")
    @DateTimeFormat(pattern = "yyyy-MM-dd hh:mm:ss")
    private Timestamp dataErro;

    @Transient
    public static List<Erro> listaErros = new ArrayList();

    public Erro() {
    }

    public Erro(Throwable erro, Class classe, String metodo) {

        this.mensagem = erro.getStackTrace()[0].getClassLoaderName()
                + " " + erro.getStackTrace()[0].getMethodName()
                + " | " + classe.getName()
                + " " + metodo
                + " " + erro.getMessage();

        this.dataErro = new Timestamp(System.currentTimeMillis());
        this.metodo = metodo;
        this.classeFinal = classe.getName();
        log.debug("Novo erro lançado por: " + mensagem);
        Erro.listaErros.add(this);
    }

    public Erro(Timestamp dataErro, String mensagem, String metodo, String classeOrigem, String classeFinal) {

        this.dataErro = dataErro;
        this.mensagem = mensagem;
        this.metodo = metodo;
        this.classeOrigem = classeOrigem;
        this.classeFinal = classeFinal;
        Erro.listaErros.add(this);

    }

}
