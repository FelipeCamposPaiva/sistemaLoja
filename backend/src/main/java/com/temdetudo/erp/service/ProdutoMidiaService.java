package com.temdetudo.erp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.ProdutoAnuncio;
import com.temdetudo.erp.entity.ProdutoMidia;
import com.temdetudo.erp.repository.ProdutoAnuncioRepository;
import com.temdetudo.erp.repository.ProdutoMidiaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProdutoMidiaService {

    private static final Set<String> FOTOS = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> VIDEOS = Set.of("video/mp4", "video/webm", "video/quicktime");
    private static final long MAX_FOTO = 8L * 1024 * 1024;
    private static final long MAX_VIDEO = 50L * 1024 * 1024;

    private final ProdutoRepository produtos;
    private final ProdutoMidiaRepository midias;
    private final ProdutoAnuncioRepository anuncios;
    private final ObjectMapper mapper;
    private final Path raiz;

    public ProdutoMidiaService(
            ProdutoRepository produtos,
            ProdutoMidiaRepository midias,
            ProdutoAnuncioRepository anuncios,
            ObjectMapper mapper,
            @Value("${erp.uploads.dir:uploads}") String dir
    ) {
        this.produtos = produtos;
        this.midias = midias;
        this.anuncios = anuncios;
        this.mapper = mapper;
        this.raiz = Path.of(dir).toAbsolutePath().normalize();
    }

    public List<ProdutoMidia> listar(Long produtoId) {
        return midias.findByProdutoIdOrderByIdAsc(produtoId);
    }

    public List<ProdutoAnuncio> anuncios(Long produtoId) {
        return anuncios.findByProdutoIdOrderByAtualizadoEmDesc(produtoId);
    }

    public ProdutoMidia salvarArquivo(Long produtoId, String tipo, MultipartFile arquivo) throws Exception {
        Produto produto = produtos.findById(produtoId).orElseThrow();
        String kind = tipo(tipo, arquivo == null ? "" : arquivo.getContentType());
        validarLimite(produtoId, kind);
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione um arquivo.");
        }
        if ("FOTO".equals(kind)) {
            if (arquivo.getSize() > MAX_FOTO) {
                throw new IllegalArgumentException("Foto acima de 8 MB.");
            }
            if (!FOTOS.contains(mime(arquivo))) {
                throw new IllegalArgumentException("Use JPG, PNG ou WEBP.");
            }
        } else {
            if (arquivo.getSize() > MAX_VIDEO) {
                throw new IllegalArgumentException("Vídeo acima de 50 MB.");
            }
            if (!VIDEOS.contains(mime(arquivo)) && !nome(arquivo.getOriginalFilename()).matches(".*\\.(mp4|webm|mov)$")) {
                throw new IllegalArgumentException("Use MP4, WEBM ou MOV.");
            }
        }
        Path pasta = raiz.resolve("produtos").resolve(String.valueOf(produtoId));
        Files.createDirectories(pasta);
        String ext = extensao(arquivo.getOriginalFilename(), mime(arquivo), kind);
        String arquivoNome = UUID.randomUUID() + ext;
        Path destino = pasta.resolve(arquivoNome);
        arquivo.transferTo(destino.toFile());

        ProdutoMidia item = new ProdutoMidia();
        item.setProdutoId(produtoId);
        item.setTipo(kind);
        item.setNome(arquivo.getOriginalFilename());
        item.setMime(mime(arquivo));
        item.setTamanho(arquivo.getSize());
        item.setArquivo("/uploads/produtos/" + produtoId + "/" + arquivoNome);
        item.setCriadoEm(LocalDateTime.now());
        ProdutoMidia salvo = midias.save(item);
        sincronizar(produto);
        return salvo;
    }

    public ProdutoMidia salvarUrl(Long produtoId, String tipo, String url, String nome) {
        Produto produto = produtos.findById(produtoId).orElseThrow();
        String kind = tipo(tipo, "");
        validarLimite(produtoId, kind);
        String link = url == null ? "" : url.trim();
        if (link.isBlank() || !(link.startsWith("http://") || link.startsWith("https://"))) {
            throw new IllegalArgumentException("Informe uma URL http(s) do vídeo.");
        }
        ProdutoMidia item = new ProdutoMidia();
        item.setProdutoId(produtoId);
        item.setTipo(kind);
        item.setNome(nome == null || nome.isBlank() ? "Vídeo externo" : nome);
        item.setUrlExterna(link);
        item.setCriadoEm(LocalDateTime.now());
        ProdutoMidia salvo = midias.save(item);
        sincronizar(produto);
        return salvo;
    }

    public void excluir(Long produtoId, Long midiaId) throws Exception {
        ProdutoMidia item = midias.findById(midiaId).orElseThrow();
        if (!produtoId.equals(item.getProdutoId())) {
            throw new IllegalArgumentException("Mídia de outro produto.");
        }
        if (item.getArquivo() != null && item.getArquivo().startsWith("/uploads/")) {
            Path arquivo = raiz.resolve(item.getArquivo().substring("/uploads/".length()));
            Files.deleteIfExists(arquivo);
        }
        midias.delete(item);
        produtos.findById(produtoId).ifPresent(this::sincronizar);
    }

    public void sincronizar(Produto produto) {
        List<ProdutoMidia> itens = midias.findByProdutoIdOrderByIdAsc(produto.getId());
        List<Map<String, Object>> fotos = new ArrayList<>();
        List<Map<String, Object>> videos = new ArrayList<>();
        for (ProdutoMidia item : itens) {
            Map<String, Object> mapa = new LinkedHashMap<>();
            mapa.put("id", item.getId());
            mapa.put("nome", item.getNome());
            mapa.put("url", item.getUrlExterna() != null ? item.getUrlExterna() : item.getArquivo());
            mapa.put("arquivo", item.getArquivo());
            mapa.put("urlExterna", item.getUrlExterna());
            mapa.put("mime", item.getMime());
            if ("VIDEO".equalsIgnoreCase(item.getTipo())) {
                videos.add(mapa);
            } else {
                fotos.add(mapa);
            }
        }
        List<Map<String, Object>> pubs = new ArrayList<>();
        for (ProdutoAnuncio anuncio : anuncios.findByProdutoIdOrderByAtualizadoEmDesc(produto.getId())) {
            Map<String, Object> mapa = new LinkedHashMap<>();
            mapa.put("id", anuncio.getId());
            mapa.put("canal", anuncio.getCanal());
            mapa.put("codigo", anuncio.getCodigo());
            mapa.put("status", anuncio.getStatus());
            mapa.put("videoEnviado", Boolean.TRUE.equals(anuncio.getVideoEnviado()));
            mapa.put("fotosEnviadas", anuncio.getFotosEnviadas());
            mapa.put("videoRemoto", anuncio.getVideoRemoto());
            mapa.put("mensagem", anuncio.getMensagem());
            pubs.add(mapa);
        }
        Map<String, Object> midia = new LinkedHashMap<>();
        midia.put("fotos", fotos);
        midia.put("videos", videos);
        midia.put("anuncios", pubs);
        try {
            produto.setMidia(mapper.writeValueAsString(midia));
        } catch (Exception ignored) {
            produto.setMidia("{}");
        }
        produto.setImagem(fotos.isEmpty() ? produto.getImagem() : String.valueOf(fotos.get(0).get("url")));
        if (fotos.isEmpty()) {
            produto.setImagem(null);
        }
        produtos.save(produto);
    }

    private void validarLimite(Long produtoId, String tipo) {
        long qtd = midias.countByProdutoIdAndTipo(produtoId, tipo);
        if ("FOTO".equals(tipo) && qtd >= 12) {
            throw new IllegalArgumentException("Máximo de 12 fotos por produto.");
        }
        if ("VIDEO".equals(tipo) && qtd >= 3) {
            throw new IllegalArgumentException("Máximo de 3 vídeos por produto.");
        }
    }

    private String tipo(String tipo, String mime) {
        String t = tipo == null ? "" : tipo.trim().toUpperCase(Locale.ROOT);
        if (t.startsWith("VID") || mime.startsWith("video/")) {
            return "VIDEO";
        }
        return "FOTO";
    }

    private String mime(MultipartFile arquivo) {
        String m = arquivo.getContentType();
        return m == null ? "application/octet-stream" : m.toLowerCase(Locale.ROOT);
    }

    private String nome(String original) {
        return original == null ? "" : original.toLowerCase(Locale.ROOT);
    }

    private String extensao(String original, String mime, String tipo) {
        String n = original == null ? "" : original;
        int ponto = n.lastIndexOf('.');
        if (ponto > 0 && ponto < n.length() - 1) {
            return n.substring(ponto).toLowerCase(Locale.ROOT);
        }
        if (mime.contains("png")) {
            return ".png";
        }
        if (mime.contains("webp")) {
            return ".webp";
        }
        if (mime.contains("webm")) {
            return ".webm";
        }
        if ("VIDEO".equals(tipo)) {
            return ".mp4";
        }
        return ".jpg";
    }
}
