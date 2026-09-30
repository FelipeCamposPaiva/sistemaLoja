package com.temdetudo.erp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.repository.MarcaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import javax.imageio.ImageIO;

@Service
public class MarcaLogoWebService {

    private static final Set<String> GENERICAS = Set.of(
            "tem", "nobrand", "central", "euro", "live", "hero", "delta", "contact", "fancy",
            "premier", "pacific", "sm", "sd", "fd", "dal", "jmd", "jst", "tks", "viz", "vmp",
            "cirad", "roma", "milk", "jojo", "eagle", "genesis", "glacier", "haiti", "imperio",
            "koala", "marcia", "mares", "nadir", "tiba", "usual", "wireless"
    );

    private static final Map<String, String> DOMINIOS = dominios();

    private final MarcaService marcas;
    private final MarcaRepository marcaRepository;
    private final ProdutoRepository produtoRepository;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    public MarcaLogoWebService(
            MarcaService marcas,
            MarcaRepository marcaRepository,
            ProdutoRepository produtoRepository,
            ObjectMapper mapper
    ) {
        this.marcas = marcas;
        this.marcaRepository = marcaRepository;
        this.produtoRepository = produtoRepository;
        this.mapper = mapper;
    }

    public Map<String, Integer> buscarEAplicar() throws Exception {
        int baixados = 0;
        int gerados = 0;
        int produtos = 0;
        for (Marca marca : marcaRepository.findAll()) {
            if (marca.getLogo() != null && !marca.getLogo().isBlank()) {
                continue;
            }
            byte[] web = buscarNaWeb(marca.getNome());
            if (web != null) {
                marcas.salvarLogoBytes(marca.getId(), web, "image/png");
                baixados += 1;
            } else {
                marcas.salvarLogoBytes(marca.getId(), letraLogo(marca.getNome()), "image/png");
                gerados += 1;
            }
        }
        Map<String, Marca> porNome = new HashMap<>();
        for (Marca marca : marcaRepository.findAll()) {
            porNome.put(chave(marca.getNome()), marca);
        }
        List<Marca> lista = marcaRepository.findAll().stream()
                .filter(m -> m.getLogo() != null && !m.getLogo().isBlank())
                .sorted((a, b) -> Integer.compare(
                        Optional.ofNullable(b.getNome()).orElse("").length(),
                        Optional.ofNullable(a.getNome()).orElse("").length()))
                .toList();
        for (Produto produto : produtoRepository.findAll()) {
            if (produto.getImagem() != null && !produto.getImagem().isBlank()) {
                continue;
            }
            Marca marca = casar(produto, lista, porNome);
            if (marca == null || marca.getLogo() == null) {
                continue;
            }
            produto.setImagem(marca.getLogo());
            if (produto.getMarcaId() == null && marca.getId() != null) {
                produto.setMarcaId(marca.getId().intValue());
            }
            produtoRepository.save(produto);
            produtos += 1;
        }
        Map<String, Integer> resumo = new LinkedHashMap<>();
        resumo.put("baixados", baixados);
        resumo.put("gerados", gerados);
        resumo.put("produtos", produtos);
        resumo.put("marcas", baixados + gerados);
        return resumo;
    }

    private Marca casar(Produto produto, List<Marca> lista, Map<String, Marca> porNome) {
        if (produto.getMarcaId() != null) {
            return marcaRepository.findById(produto.getMarcaId().longValue()).orElse(null);
        }
        String nome = chave(produto.getNome());
        if (nome.isBlank()) {
            return null;
        }
        for (Marca marca : lista) {
            String m = chave(marca.getNome());
            if (m.length() < 3 && !m.equals("3m")) {
                continue;
            }
            if (GENERICAS.contains(m)) {
                continue;
            }
            if (m.length() <= 3) {
                for (String token : nome.split("[^a-z0-9]+")) {
                    if (token.equals(m)) {
                        return marca;
                    }
                }
            } else if (nome.contains(m)) {
                return marca;
            }
        }
        return porNome.get(nome);
    }

    private byte[] buscarNaWeb(String nome) {
        String dominio = DOMINIOS.get(chave(nome));
        if (dominio != null) {
            byte[] logo = baixar("https://logo.clearbit.com/" + dominio);
            if (logo != null) {
                return logo;
            }
            return wikipedia(nome);
        }
        return null;
    }

    private byte[] wikipedia(String nome) {
        try {
            String q = URLEncoder.encode(nome + " marca", StandardCharsets.UTF_8);
            String url = "https://pt.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages"
                    + "&piprop=thumbnail&pithumbsize=400&generator=search&gsrlimit=1&gsrsearch=" + q;
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .header("User-Agent", "ERP-TemDeTudo/1.0 (cadastro de marcas)")
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 400) {
                return null;
            }
            JsonNode pages = mapper.readTree(res.body()).path("query").path("pages");
            if (!pages.isObject()) {
                return null;
            }
            for (JsonNode page : pages) {
                String thumb = page.path("thumbnail").path("source").asText("");
                if (!thumb.isBlank()) {
                    return baixar(thumb);
                }
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private byte[] baixar(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "ERP-TemDeTudo/1.0 (cadastro de marcas)")
                    .GET()
                    .build();
            HttpResponse<byte[]> res = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (res.statusCode() >= 400) {
                return null;
            }
            byte[] corpo = res.body();
            if (corpo == null || corpo.length < 80 || corpo.length > 8 * 1024 * 1024) {
                return null;
            }
            String tipo = res.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
            if (tipo.contains("html") || tipo.contains("json") || tipo.contains("text")) {
                return null;
            }
            return corpo;
        } catch (Exception ignored) {
            return null;
        }
    }

    private byte[] letraLogo(String nome) throws Exception {
        String texto = iniciais(nome);
        int hash = Math.abs(chave(nome).hashCode());
        Color fundo = Color.getHSBColor((hash % 360) / 360f, 0.55f, 0.88f);
        BufferedImage img = new BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setColor(fundo);
        g.fillRoundRect(8, 8, 240, 240, 48, 48);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, texto.length() > 2 ? 72 : 96));
        int w = g.getFontMetrics().stringWidth(texto);
        int h = g.getFontMetrics().getAscent();
        g.drawString(texto, (256 - w) / 2, (256 + h) / 2 - 12);
        g.dispose();
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        ImageIO.write(img, "png", saida);
        return saida.toByteArray();
    }

    private String iniciais(String nome) {
        String limpo = String.valueOf(nome == null ? "" : nome).trim();
        if (limpo.isEmpty()) {
            return "M";
        }
        String[] partes = limpo.split("[\\s\\-/&]+");
        if (partes.length == 1) {
            String p = partes[0];
            return p.length() <= 3 ? p.toUpperCase(Locale.ROOT) : p.substring(0, 2).toUpperCase(Locale.ROOT);
        }
        String a = partes[0].substring(0, 1);
        String b = partes[1].substring(0, 1);
        return (a + b).toUpperCase(Locale.ROOT);
    }

    private String chave(String nome) {
        String n = Normalizer.normalize(String.valueOf(nome == null ? "" : nome), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace("'", "")
                .trim();
        return n;
    }

    private static Map<String, String> dominios() {
        Map<String, String> m = new HashMap<>();
        m.put("3m", "3m.com.br");
        m.put("acrilex", "acrilex.com.br");
        m.put("acrimet", "acrimet.com.br");
        m.put("bic", "bic.com");
        m.put("candide", "candide.com.br");
        m.put("chamex", "chamex.com.br");
        m.put("ciranda cultural", "cirandacultural.com.br");
        m.put("cis", "cis.com.br");
        m.put("coats", "coats.com");
        m.put("compactor", "compactor.com.br");
        m.put("cromus", "cromus.com.br");
        m.put("dac", "dac.com.br");
        m.put("dello", "dello.com.br");
        m.put("elgin", "elgin.com.br");
        m.put("elka", "elka.com.br");
        m.put("estrela", "estrela.com.br");
        m.put("faber-castell", "faber-castell.com.br");
        m.put("foroni", "foroni.com.br");
        m.put("giotto", "giotto.com");
        m.put("grow", "grow.com.br");
        m.put("jandaia", "jandaia.com.br");
        m.put("leo&leo", "leoeleo.com.br");
        m.put("maped", "maped.com");
        m.put("mattel", "mattel.com");
        m.put("mercur", "mercur.com.br");
        m.put("multikids", "multikids.com.br");
        m.put("multilaser", "multilaser.com.br");
        m.put("nadir", "nadir.com.br");
        m.put("natura", "natura.com.br");
        m.put("panini", "panini.com.br");
        m.put("paper mate", "papermate.com");
        m.put("pentel", "pentel.com.br");
        m.put("pilot", "pilotpen.com.br");
        m.put("pimaco", "pimaco.com.br");
        m.put("plasutil", "plasutil.com.br");
        m.put("post it", "post-it.com");
        m.put("prafesta", "prafesta.com.br");
        m.put("radex", "radex.com.br");
        m.put("rayovac", "rayovac.com.br");
        m.put("samsung", "samsung.com");
        m.put("sharpie", "sharpie.com");
        m.put("singer", "singer.com");
        m.put("tem de tudo", "temdetudovr.com.br");
        m.put("tilibra", "tilibra.com.br");
        m.put("tramontina", "tramontina.com.br");
        m.put("tris", "tris.com.br");
        m.put("uni ball", "uniball.com");
        m.put("waleu", "waleu.com.br");
        m.put("xalingo", "xalingo.com.br");
        m.put("xiaomi", "xiaomi.com");
        m.put("adelbras", "adelbras.com.br");
        m.put("braskit", "braskit.com.br");
        m.put("colormake", "colormake.com.br");
        m.put("festcolor", "festcolor.com.br");
        m.put("kaz", "kaz.com.br");
        m.put("macrilan", "macrilan.com.br");
        m.put("merheje", "merheje.com.br");
        m.put("pais e filhos", "paisefilhos.com.br");
        m.put("progresso", "progresso.com.br");
        m.put("tek bond", "tekbond.com.br");
        m.put("tekbond", "tekbond.com.br");
        m.put("toyster", "toyster.com.br");
        m.put("toyng", "toyng.com.br");
        m.put("vivai", "vivai.com.br");
        return m;
    }
}
