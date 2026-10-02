package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.repository.MarcaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.security.UsuarioAtual;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import javax.sql.DataSource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MarcaService {

    @Autowired
    private MarcaRepository repository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private DataSource dataSource;

    @Value("${erp.uploads.dir:uploads}")
    private String uploadsDir;

    private static final Set<String> FOTOS = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @PostConstruct
    void ampliarLogo() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            stmt.execute("ALTER TABLE marcas MODIFY COLUMN logo VARCHAR(500) NULL");
            try {
                stmt.execute("ALTER TABLE marcas ADD COLUMN criado_por VARCHAR(150) NULL");
            } catch (Exception ignoredCol) {
                /* coluna já existe */
            }
            try {
                stmt.execute("ALTER TABLE marcas ADD COLUMN atualizado_por VARCHAR(150) NULL");
            } catch (Exception ignoredCol) {
                /* coluna já existe */
            }
        } catch (Exception ignored) {
            /* coluna já pode ter o tamanho novo */
        }
    }

    public List<Marca> listar() {
        List<Marca> marcas = repository.findAll();
        Map<Integer, Integer> contagens = new LinkedHashMap<>();
        try {
            for (Object[] linha : produtoRepository.contarPorMarcaId()) {
                if (linha == null || linha[0] == null) {
                    continue;
                }
                Integer id = ((Number) linha[0]).intValue();
                Integer qtd = linha[1] == null ? 0 : ((Number) linha[1]).intValue();
                contagens.put(id, qtd);
            }
        } catch (Exception ignored) {
            /* tabela produtos pode não ter marca_id */
        }
        for (Marca marca : marcas) {
            if (marca.getId() != null) {
                marca.setQtdProdutos(contagens.getOrDefault(marca.getId().intValue(), 0));
            }
        }
        return marcas;
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

        String quem = primeiroNaoVazio(nomeUsuario(), marca.getAtualizadoPor(), marca.getCriadoPor());
        if (marca.getId() == null) {
            marca.setCriadoPor(primeiroNaoVazio(marca.getCriadoPor(), quem));
        }
        if (quem != null) {
            marca.setAtualizadoPor(quem);
        }
        return repository.save(marca);

    }

    public Marca atualizar(Long id, Marca marca) {

        Marca existente = buscar(id);

        existente.setNome(marca.getNome());
        existente.setFabricante(marca.getFabricante());
        existente.setDescricao(marca.getDescricao());
        if (marca.getLogo() != null && !marca.getLogo().isBlank()) {
            existente.setLogo(marca.getLogo());
        }
        existente.setSite(marca.getSite());
        existente.setEmail(marca.getEmail());
        existente.setTelefone(marca.getTelefone());
        existente.setAtivo(marca.getAtivo());
        String quem = primeiroNaoVazio(nomeUsuario(), marca.getAtualizadoPor());
        if (quem != null) {
            existente.setAtualizadoPor(quem);
        }

        return repository.save(existente);

    }

    public void excluir(Long id) {

        repository.deleteById(id);

    }

    @Transactional
    public Map<String, Integer> importar(List<Marca> itens) {
        int novos = 0;
        int ignorados = 0;
        if (itens != null) {
            for (Marca recebido : itens) {
                if (recebido == null || recebido.getNome() == null) {
                    continue;
                }
                String nome = recebido.getNome().trim();
                if (nome.isBlank()) {
                    continue;
                }
                if (repository.existsByNomeIgnoreCase(nome)) {
                    ignorados += 1;
                    continue;
                }
                Marca marca = new Marca();
                marca.setNome(nome);
                marca.setFabricante(recebido.getFabricante());
                marca.setDescricao(recebido.getDescricao());
                marca.setAtivo(recebido.getAtivo() == null ? Boolean.TRUE : recebido.getAtivo());
                marca.setTelefone(recebido.getTelefone());
                String quem = nomeUsuario();
                marca.setCriadoPor(quem);
                marca.setAtualizadoPor(quem);
                repository.save(marca);
                novos += 1;
            }
        }
        Map<String, Integer> resumo = new LinkedHashMap<>();
        resumo.put("novos", novos);
        resumo.put("ignorados", ignorados);
        resumo.put("total", novos + ignorados);
        return resumo;
    }

    @Transactional
    public Marca salvarLogo(Long id, MultipartFile arquivo) throws Exception {
        Marca marca = buscar(id);
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione a imagem da marca.");
        }
        if (arquivo.getSize() > 8L * 1024 * 1024) {
            throw new IllegalArgumentException("Imagem acima de 8 MB.");
        }
        String mime = arquivo.getContentType() == null ? "" : arquivo.getContentType().toLowerCase(Locale.ROOT);
        String nome = arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!FOTOS.contains(mime) && !nome.matches(".*\\.(jpe?g|png|webp|gif)$")) {
            throw new IllegalArgumentException("Use JPG, PNG ou WEBP.");
        }
        Path pasta = Path.of(uploadsDir).toAbsolutePath().normalize().resolve("marcas").resolve(String.valueOf(id));
        Files.createDirectories(pasta);
        apagarArquivo(marca.getLogo());
        String ext = extensao(nome, mime);
        String arquivoNome = UUID.randomUUID() + ext;
        arquivo.transferTo(pasta.resolve(arquivoNome).toFile());
        marca.setLogo("/uploads/marcas/" + id + "/" + arquivoNome);
        marca.setAtualizadoPor(nomeUsuario());
        return repository.save(marca);
    }

    @Transactional
    public Marca salvarLogoBytes(Long id, byte[] bytes, String mime) throws Exception {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Selecione a imagem da marca.");
        }
        if (bytes.length > 8L * 1024 * 1024) {
            throw new IllegalArgumentException("Imagem acima de 8 MB.");
        }
        String tipo = mime == null ? "image/png" : mime.toLowerCase(Locale.ROOT);
        if (!FOTOS.contains(tipo)) {
            tipo = "image/png";
        }
        Marca marca = buscar(id);
        Path pasta = Path.of(uploadsDir).toAbsolutePath().normalize().resolve("marcas").resolve(String.valueOf(id));
        Files.createDirectories(pasta);
        apagarArquivo(marca.getLogo());
        String arquivoNome = UUID.randomUUID() + extensao("", tipo);
        Files.write(pasta.resolve(arquivoNome), bytes);
        marca.setLogo("/uploads/marcas/" + id + "/" + arquivoNome);
        marca.setAtualizadoPor(nomeUsuario());
        return repository.save(marca);
    }

    @Transactional
    public Marca removerLogo(Long id) throws Exception {
        Marca marca = buscar(id);
        apagarArquivo(marca.getLogo());
        marca.setLogo(null);
        marca.setAtualizadoPor(nomeUsuario());
        return repository.save(marca);
    }

    private String nomeUsuario() {
        return UsuarioAtual.obter().map(usuario -> primeiroNaoVazio(
                usuario.getNome(),
                usuario.getUsuario(),
                usuario.getEmail()
        )).orElse(null);
    }

    private String primeiroNaoVazio(String... valores) {
        if (valores == null) {
            return null;
        }
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor.trim();
            }
        }
        return null;
    }

    private void apagarArquivo(String logo) throws Exception {
        if (logo == null || !logo.startsWith("/uploads/")) {
            return;
        }
        Path arquivo = Path.of(uploadsDir).toAbsolutePath().normalize().resolve(logo.substring("/uploads/".length()));
        Files.deleteIfExists(arquivo);
    }

    private String extensao(String nome, String mime) {
        if (nome.endsWith(".png") || "image/png".equals(mime)) {
            return ".png";
        }
        if (nome.endsWith(".webp") || "image/webp".equals(mime)) {
            return ".webp";
        }
        if (nome.endsWith(".gif") || "image/gif".equals(mime)) {
            return ".gif";
        }
        return ".jpg";
    }

}