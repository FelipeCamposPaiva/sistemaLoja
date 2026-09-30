package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.ProdutoAnuncio;
import com.temdetudo.erp.entity.ProdutoMidia;
import com.temdetudo.erp.repository.ProdutoAnuncioRepository;
import com.temdetudo.erp.repository.ProdutoMidiaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class MarketplaceAnuncioService {

    private final ProdutoRepository produtos;
    private final ProdutoMidiaRepository midias;
    private final ProdutoAnuncioRepository anuncios;
    private final ProdutoMidiaService midiaService;
    private final AuditoriaService auditoria;

    public MarketplaceAnuncioService(
            ProdutoRepository produtos,
            ProdutoMidiaRepository midias,
            ProdutoAnuncioRepository anuncios,
            ProdutoMidiaService midiaService,
            AuditoriaService auditoria
    ) {
        this.produtos = produtos;
        this.midias = midias;
        this.anuncios = anuncios;
        this.midiaService = midiaService;
        this.auditoria = auditoria;
    }

    public List<ProdutoAnuncio> publicar(Long produtoId, List<String> canais) {
        Produto produto = produtos.findById(produtoId).orElseThrow();
        List<ProdutoMidia> itens = midias.findByProdutoIdOrderByIdAsc(produtoId);
        List<ProdutoMidia> fotos = itens.stream().filter(i -> "FOTO".equalsIgnoreCase(i.getTipo())).toList();
        List<ProdutoMidia> videos = itens.stream().filter(i -> "VIDEO".equalsIgnoreCase(i.getTipo())).toList();
        if (fotos.isEmpty() && videos.isEmpty()) {
            throw new IllegalArgumentException("Anexe fotos ou um vídeo antes de publicar o anúncio.");
        }
        List<String> destinos = (canais == null || canais.isEmpty())
                ? List.of("mercado-livre", "shopee")
                : canais.stream().map(c -> c.toLowerCase(Locale.ROOT)).toList();
        List<ProdutoAnuncio> saida = new ArrayList<>();
        for (String canal : destinos) {
            if (!"mercado-livre".equals(canal) && !"shopee".equals(canal)) {
                continue;
            }
            ProdutoAnuncio anuncio = anuncios.findFirstByProdutoIdAndCanal(produtoId, canal)
                    .orElseGet(ProdutoAnuncio::new);
            anuncio.setProdutoId(produtoId);
            anuncio.setCanal(canal);
            anuncio.setCodigo(codigo(canal, produtoId, anuncio.getId()));
            anuncio.setStatus("PUBLICADO");
            anuncio.setFotosEnviadas(fotos.size());
            boolean temVideo = !videos.isEmpty();
            anuncio.setVideoEnviado(temVideo);
            anuncio.setVideoRemoto(temVideo ? remoto(canal, produtoId) : null);
            anuncio.setMensagem(temVideo
                    ? "Fotos e vídeo enviados ao anúncio."
                    : "Fotos enviadas. Inclua um vídeo no cadastro para impulsionar o anúncio.");
            anuncio.setAtualizadoEm(LocalDateTime.now());
            saida.add(anuncios.save(anuncio));
        }
        if (saida.isEmpty()) {
            throw new IllegalArgumentException("Selecione Mercado Livre ou Shopee.");
        }
        midiaService.sincronizar(produto);
        auditoria.registrarResumo(
                "PRODUTO",
                produtoId,
                produto.getNome(),
                "ANUNCIO",
                "Publicou anúncio com mídia em " + saida.stream().map(ProdutoAnuncio::getCanal).toList()
        );
        return saida;
    }

    @Transactional
    public int excluirPorCanal(String canal) {
        String id = canal == null ? "" : canal.toLowerCase(Locale.ROOT);
        List<ProdutoAnuncio> lista = anuncios.findAll().stream()
                .filter(a -> id.equalsIgnoreCase(a.getCanal()))
                .toList();
        anuncios.deleteByCanal(id);
        lista.stream().map(ProdutoAnuncio::getProdutoId).distinct().forEach(pid ->
                produtos.findById(pid).ifPresent(midiaService::sincronizar)
        );
        return lista.size();
    }

    public Map<String, Object> resumo(ProdutoAnuncio anuncio) {
        return Map.of(
                "id", anuncio.getId(),
                "canal", anuncio.getCanal(),
                "codigo", anuncio.getCodigo() == null ? "" : anuncio.getCodigo(),
                "status", anuncio.getStatus() == null ? "" : anuncio.getStatus(),
                "videoEnviado", Boolean.TRUE.equals(anuncio.getVideoEnviado()),
                "fotosEnviadas", anuncio.getFotosEnviadas() == null ? 0 : anuncio.getFotosEnviadas(),
                "videoRemoto", anuncio.getVideoRemoto() == null ? "" : anuncio.getVideoRemoto(),
                "mensagem", anuncio.getMensagem() == null ? "" : anuncio.getMensagem()
        );
    }

    private String codigo(String canal, Long produtoId, Long anuncioId) {
        long n = anuncioId == null ? produtoId * 17 + 34000 : anuncioId;
        if ("shopee".equals(canal)) {
            return "SHP-" + (100000 + n);
        }
        return "MLB" + (2000000000L + n);
    }

    private String remoto(String canal, Long produtoId) {
        if ("shopee".equals(canal)) {
            return "SHP-VID-" + produtoId;
        }
        return "ML-VID-" + produtoId;
    }
}
