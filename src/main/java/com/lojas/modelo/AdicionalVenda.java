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
@Table(name = "adicional_venda")

public class AdicionalVenda implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "vendas_id")
    private Long vendasId;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "adicionais_id")
    private Long adicionaisId;

    @Column(name = "nome")
    private String nome;

    @Column(name = "valor")
    private double valor;

    @Column(name = "imagem")
    private String imagem;

}
