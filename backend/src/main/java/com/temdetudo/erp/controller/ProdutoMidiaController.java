package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.ProdutoAnuncio;
import com.temdetudo.erp.entity.ProdutoMidia;
import com.temdetudo.erp.service.MarketplaceAnuncioService;
import com.temdetudo.erp.service.ProdutoMidiaService;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin("*")
public class ProdutoMidiaController {

    private final ProdutoMidiaService midia;
    private final MarketplaceAnuncioService anuncios;

    public ProdutoMidiaController(ProdutoMidiaService midia, MarketplaceAnuncioService anuncios) {
        this.midia = midia;
        this.anuncios = anuncios;
    }

    @GetMapping("/{id}/midia")
    public Map<String, Object> listar(@PathVariable Long id) {
        return Map.of(
                "itens", midia.listar(id),
                "anuncios", midia.anuncios(id)
        );
    }

    @PostMapping(value = "/{id}/midia", consumes = {"multipart/form-data"})
    public ProdutoMidia enviarArquivo(
            @PathVariable Long id,
            @RequestParam(defaultValue = "FOTO") String tipo,
            @RequestPart("arquivo") MultipartFile arquivo
    ) throws Exception {
        return midia.salvarArquivo(id, tipo, arquivo);
    }

    @PostMapping("/{id}/midia/url")
    public ProdutoMidia enviarUrl(
            @PathVariable Long id,
            @RequestBody Map<String, String> corpo
    ) {
        return midia.salvarUrl(id, corpo.getOrDefault("tipo", "VIDEO"), corpo.get("url"), corpo.get("nome"));
    }

    @DeleteMapping("/{id}/midia/{midiaId}")
    public void excluir(@PathVariable Long id, @PathVariable Long midiaId) throws Exception {
        midia.excluir(id, midiaId);
    }

    @GetMapping("/{id}/anuncios")
    public List<ProdutoAnuncio> anuncios(@PathVariable Long id) {
        return midia.anuncios(id);
    }

    @PostMapping("/{id}/anuncios")
    public List<Map<String, Object>> publicar(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> corpo
    ) {
        List<String> canais = new java.util.ArrayList<>();
        Object raw = corpo == null ? null : corpo.get("canais");
        if (raw instanceof List<?> lista) {
            for (Object item : lista) {
                if (item != null) {
                    canais.add(String.valueOf(item));
                }
            }
        }
        return anuncios.publicar(id, canais).stream().map(anuncios::resumo).toList();
    }
}
