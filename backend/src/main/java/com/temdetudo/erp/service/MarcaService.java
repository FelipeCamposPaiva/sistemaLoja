package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.repository.MarcaRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MarcaService {

    @Autowired
    private MarcaRepository repository;

    public List<Marca> listar() {

        return repository.findAll();

    }

    public List<Marca> listarAtivas() {

        return repository.findByAtivoTrue();

    }

    public Marca buscar(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Marca não encontrada."));

    }

    public Marca salvar(Marca marca) {

        if (marca.getId() == null &&
                repository.existsByNomeIgnoreCase(marca.getNome())) {

            throw new RuntimeException(
                    "Já existe uma marca com esse nome."
            );

        }

        return repository.save(marca);

    }

    public Marca atualizar(Long id, Marca marca) {

        Marca existente = buscar(id);

        existente.setNome(marca.getNome());
        existente.setFabricante(marca.getFabricante());
        existente.setDescricao(marca.getDescricao());
        existente.setLogo(marca.getLogo());
        existente.setSite(marca.getSite());
        existente.setEmail(marca.getEmail());
        existente.setTelefone(marca.getTelefone());
        existente.setAtivo(marca.getAtivo());

        return repository.save(existente);

    }

    public void excluir(Long id) {

        repository.deleteById(id);

    }

}