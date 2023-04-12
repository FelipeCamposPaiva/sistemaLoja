package com.lojas.modelo.classId;

import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Setter
@Getter
public class AndamentoId implements Serializable {

    private long idEvento;
    private String idPessoa;

    public AndamentoId(long idEvento, String idPessoa) {

        this.idEvento = idEvento;
        this.idPessoa = idPessoa;

    }

    @Override
    public boolean equals(Object obj) {
        return super.equals(obj); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public int hashCode() {
        return super.hashCode(); //To change body of generated methods, choose Tools | Templates.
    }

}
