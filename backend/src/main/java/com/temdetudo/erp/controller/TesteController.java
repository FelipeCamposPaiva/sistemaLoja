package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.repository.ClienteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TesteController {

    @Autowired
    private ClienteRepository repository;

    @GetMapping("/")
    public String home() {
        return "ERP Tem de Tudo Backend OK";
    }

    @GetMapping("/api/teste")
    public String teste() {
        return "API funcionando";
    }

    @GetMapping("/popular")
    public String popular() {

        Cliente c = new Cliente();

        c.setNome("Felipe");
        c.setTelefone("24981285708");
        c.setEmail("atendimento@temdetudovr.com.br");

        repository.save(c);

        return "Cliente criado";
    }
}