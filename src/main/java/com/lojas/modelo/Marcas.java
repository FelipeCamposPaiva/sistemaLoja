package com.lojas.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class Marcas implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "codigo")
    private String codigo;

    @Column(name = "nome")
    private String nome;

    @Column(name = "imagem")
    private String imagem;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "ativo")
    private boolean ativo;

}
