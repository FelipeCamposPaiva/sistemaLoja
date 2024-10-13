package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class Enderecos implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "clientes_id")
    private Long clientesId;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "cep")
    private String cep;

    @Column(name = "endereco")
    private String endereco;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "uf")
    private String uf;

    @Column(name = "latitude")
    private String latitude;

    @Column(name = "Longitude")
    private String Longitude;

    @Column(name = "principal")
    private String principal;

}
