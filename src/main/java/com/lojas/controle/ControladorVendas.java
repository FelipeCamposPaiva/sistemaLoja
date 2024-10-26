package com.lojas.controle;


import com.lojas.modelo.Vendas;
import com.lojas.modelo.repositorio.IVendas;
import java.util.List;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.hateoas.server.ExposesResourceFor;

@CrossOrigin(origins = {"*"})
@RequestMapping("/vendas")
@RestController
@ExposesResourceFor(Vendas.class)
@Log4j2
public class ControladorVendas {

    @Autowired
    IVendas repo;

    @GetMapping(value = "/", produces = {"application/hal+json"})
    public List<Vendas> todos() {

        return repo.findAll();
    }
}
