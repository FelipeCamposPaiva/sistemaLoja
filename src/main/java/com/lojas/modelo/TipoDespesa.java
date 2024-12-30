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
@Table(name = "tipo_despesa")

public class TipoDespesa implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "nome")
    private String nome;

    @Column(name = "ativo")
    private boolean ativo;

}
