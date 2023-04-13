package com.lojas.controle;

import com.lojas.modelo.CadProdutos;
import com.lojas.modelo.CadProdutosRepositorio;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
@RestController
public class ControladorCadProduto extends RepresentationModel<ControladorCadProduto> {

    @Autowired
    CadProdutosRepositorio repositorio;

    //************************************************************************************************//
    @RequestMapping(value = {"/"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*"})
    public String getIndex() {
        return "Teste tela inicial";
    }

    //************************************************************************************************//
    @RequestMapping(value = {"/produtos"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*"})
    public List<CadProdutos> getProdutos(HttpServletRequest request, HttpSession sessao) {
        List<CadProdutos> lista = (List<CadProdutos>) repositorio.findAll();

        return lista;
    }

    //************************************************************************************************//
    @RequestMapping(value = {"/produtos/{codigo}"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*"})
    public CadProdutos getProdutosPeloCodigo(@PathVariable("codigo") String codigo, HttpServletRequest request, HttpSession sessao) {
        CadProdutos cadProduto = repositorio.findById(codigo).get();
        return cadProduto;
    }

}
