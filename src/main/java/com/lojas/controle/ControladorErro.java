package com.lojas.controle;

import com.lojas.modelo.ErroRepositorio;
import java.util.List;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
@RestController
public class ControladorErro {

    @Autowired
    ErroRepositorio repositorio;

    public void salvar(List lista) {

        log.debug("salvando " + lista.size());
        repositorio.saveAll(lista);
    }
}
