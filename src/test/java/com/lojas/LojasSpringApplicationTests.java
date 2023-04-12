package com.lojas;

import com.lojas.modelo.CadProdutos;
import com.lojas.modelo.CadProdutosRepositorio;
import com.lojas.modelo.LeitorTabela;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
class LojasSpringApplicationTests {

    @Autowired
    CadProdutosRepositorio cadProdutosRepositorio;

    @Test
    void contextLoads() {
//        new LeitorTabela();

//        for (CadProdutos cp : LeitorTabela.lista) {
//            cadProdutosRepositorio.save(cp);
//        }
    }

}
