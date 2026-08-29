package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.StatusDTO;
import com.temdetudo.erp.entity.OrdemServico;
import com.temdetudo.erp.repository.OrdemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/os")
@CrossOrigin("*")
public class OrdemServicoController {

    @Autowired
    private OrdemServicoRepository repository;

    @GetMapping
    public List<OrdemServico> listar() {
        return repository.findAll();
    }

    @PostMapping
    public OrdemServico salvar(@RequestBody OrdemServico os) {
        return repository.save(os);
    }

    @PutMapping("/{id}/status")
    public OrdemServico atualizarStatus(
            @PathVariable Long id,
            @RequestBody StatusDTO dto) {

        OrdemServico os =
                repository.findById(id)
                        .orElseThrow();

        os.setStatus(dto.getStatus());

        return repository.save(os);
    }
}