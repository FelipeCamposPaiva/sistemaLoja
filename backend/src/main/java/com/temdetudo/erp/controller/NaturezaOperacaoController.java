package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.NaturezaSugeridaDTO;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.NaturezaOperacao;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.service.NaturezaOperacaoService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/naturezas-operacao")
@CrossOrigin("*")
public class NaturezaOperacaoController {

    private final NaturezaOperacaoService service;
    private final ClienteRepository clienteRepository;

    public NaturezaOperacaoController(NaturezaOperacaoService service, ClienteRepository clienteRepository) {
        this.service = service;
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    public List<NaturezaOperacao> listar() {
        return service.listar();
    }

    @GetMapping("/sugerir")
    public NaturezaSugeridaDTO sugerir(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) String uf,
            @RequestParam(required = false) String cpfCnpj,
            @RequestParam(required = false) String tipoPessoa,
            @RequestParam(required = false) String contribuinte,
            @RequestParam(required = false) Boolean consumidorFinal,
            @RequestParam(required = false) String finalidade
    ) {
        if (clienteId != null) {
            Cliente cliente = clienteRepository.findById(clienteId).orElse(null);
            if (cliente != null) {
                return service.sugerir(cliente);
            }
        }
        return service.sugerir(uf, cpfCnpj, tipoPessoa, contribuinte, consumidorFinal, finalidade);
    }
}
