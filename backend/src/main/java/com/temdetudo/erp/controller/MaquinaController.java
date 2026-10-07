package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Maquina;
import com.temdetudo.erp.entity.MaquinaConsumivel;
import com.temdetudo.erp.entity.MaquinaDocumento;
import com.temdetudo.erp.entity.MaquinaFoto;
import com.temdetudo.erp.entity.MaquinaManutencao;
import com.temdetudo.erp.entity.MaquinaManutencaoFoto;
import com.temdetudo.erp.service.MaquinaFichaService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maquinas")
@CrossOrigin("*")
public class MaquinaController {

    private final MaquinaFichaService ficha;

    public MaquinaController(MaquinaFichaService ficha) {
        this.ficha = ficha;
    }

    @GetMapping
    public List<Maquina> listar() {
        return ficha.listar();
    }

    @GetMapping("/{id}")
    public Maquina buscar(@PathVariable Long id) {
        return ficha.buscar(id);
    }

    @GetMapping("/{id}/ficha")
    public Map<String, Object> abrirFicha(@PathVariable Long id) {
        ficha.prepararAcesso(id);
        return ficha.ficha(id);
    }

    @PostMapping
    public Maquina salvar(@RequestBody Maquina pedido) {
        return ficha.salvar(null, pedido);
    }

    @PutMapping("/{id}")
    public Maquina atualizar(@PathVariable Long id, @RequestBody Maquina pedido) {
        return ficha.salvar(id, pedido);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        ficha.excluir(id);
    }

    @PostMapping(value = "/{id}/fotos", consumes = "multipart/form-data")
    public MaquinaFoto enviarFoto(@PathVariable Long id, @RequestPart("arquivo") MultipartFile arquivo) throws Exception {
        return ficha.salvarFoto(id, arquivo);
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    public void excluirFoto(@PathVariable Long id, @PathVariable Long fotoId) {
        ficha.excluirFoto(id, fotoId);
    }

    @PutMapping("/{id}/consumiveis")
    public List<MaquinaConsumivel> consumiveis(@PathVariable Long id, @RequestBody List<MaquinaConsumivel> itens) {
        return ficha.substituirConsumiveis(id, itens);
    }

    @PostMapping("/{id}/manutencoes")
    public MaquinaManutencao criarManutencao(@PathVariable Long id, @RequestBody MaquinaManutencao pedido) {
        return ficha.salvarManutencao(id, null, pedido);
    }

    @PutMapping("/{id}/manutencoes/{manutencaoId}")
    public MaquinaManutencao atualizarManutencao(
            @PathVariable Long id,
            @PathVariable Long manutencaoId,
            @RequestBody MaquinaManutencao pedido
    ) {
        return ficha.salvarManutencao(id, manutencaoId, pedido);
    }

    @DeleteMapping("/{id}/manutencoes/{manutencaoId}")
    public void excluirManutencao(@PathVariable Long id, @PathVariable Long manutencaoId) {
        ficha.excluirManutencao(id, manutencaoId);
    }

    @PostMapping(value = "/{id}/manutencoes/{manutencaoId}/fotos", consumes = "multipart/form-data")
    public MaquinaManutencaoFoto enviarFotoManutencao(
            @PathVariable Long id,
            @PathVariable Long manutencaoId,
            @RequestPart("arquivo") MultipartFile arquivo
    ) throws Exception {
        return ficha.salvarFotoManutencao(id, manutencaoId, arquivo);
    }

    @DeleteMapping("/{id}/manutencoes/{manutencaoId}/fotos/{fotoId}")
    public void excluirFotoManutencao(
            @PathVariable Long id,
            @PathVariable Long manutencaoId,
            @PathVariable Long fotoId
    ) {
        ficha.excluirFotoManutencao(id, manutencaoId, fotoId);
    }

    @PostMapping(value = "/{id}/documentos", consumes = "multipart/form-data")
    public MaquinaDocumento enviarDocumento(@PathVariable Long id, @RequestPart("arquivo") MultipartFile arquivo) throws Exception {
        return ficha.salvarDocumento(id, arquivo);
    }

    @DeleteMapping("/{id}/documentos/{documentoId}")
    public void excluirDocumento(@PathVariable Long id, @PathVariable Long documentoId) {
        ficha.excluirDocumento(id, documentoId);
    }
}
