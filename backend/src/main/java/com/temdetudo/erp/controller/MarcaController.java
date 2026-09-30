package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.service.MarcaLogoWebService;
import com.temdetudo.erp.service.MarcaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marcas")
@CrossOrigin("*")
public class MarcaController {

    @Autowired
    private MarcaService service;

    @Autowired
    private MarcaLogoWebService logosWeb;

    @GetMapping
    public List<Marca> listar() {

        return service.listar();

    }

    @GetMapping("/ativas")
    public List<Marca> listarAtivas() {

        return service.listarAtivas();

    }

    @GetMapping("/{id}")
    public Marca buscar(
            @PathVariable Long id
    ) {

        return service.buscar(id);

    }

    @PostMapping
    public Marca salvar(
            @RequestBody Marca marca
    ) {

        return service.salvar(marca);

    }

    @PutMapping("/{id}")
    public Marca atualizar(
            @PathVariable Long id,
            @RequestBody Marca marca
    ) {

        return service.atualizar(id, marca);

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        service.excluir(id);

    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(@RequestBody List<Marca> itens) {
        return service.importar(itens);
    }

    @PostMapping("/logos-web")
    public Map<String, Integer> logosWeb() throws Exception {
        return logosWeb.buscarEAplicar();
    }

    @PostMapping(value = "/{id}/logo", consumes = {"multipart/form-data"})
    public Marca enviarLogo(@PathVariable Long id, @RequestPart("arquivo") MultipartFile arquivo) throws Exception {
        return service.salvarLogo(id, arquivo);
    }

    @DeleteMapping("/{id}/logo")
    public Marca removerLogo(@PathVariable Long id) throws Exception {
        return service.removerLogo(id);
    }

}