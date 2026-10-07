package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.BemPatrimonial;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.Maquina;
import com.temdetudo.erp.entity.MaquinaChecklist;
import com.temdetudo.erp.entity.MaquinaConsumivel;
import com.temdetudo.erp.entity.MaquinaDocumento;
import com.temdetudo.erp.entity.MaquinaFoto;
import com.temdetudo.erp.entity.MaquinaManutencao;
import com.temdetudo.erp.entity.MaquinaManutencaoFoto;
import com.temdetudo.erp.entity.NotaEntrada;
import com.temdetudo.erp.entity.OrdemServico;
import com.temdetudo.erp.repository.BemPatrimonialRepository;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.repository.MaquinaChecklistRepository;
import com.temdetudo.erp.repository.MaquinaConsumivelRepository;
import com.temdetudo.erp.repository.MaquinaDocumentoRepository;
import com.temdetudo.erp.repository.MaquinaFotoRepository;
import com.temdetudo.erp.repository.MaquinaManutencaoFotoRepository;
import com.temdetudo.erp.repository.MaquinaManutencaoRepository;
import com.temdetudo.erp.repository.MaquinaRepository;
import com.temdetudo.erp.repository.NotaEntradaRepository;
import com.temdetudo.erp.repository.OrdemServicoRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MaquinaFichaService {

    private static final Set<String> IMAGENS = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> DOCS = Set.of("application/pdf", "image/jpeg", "image/png", "image/webp");
    private static final long MAX = 8L * 1024 * 1024;

    private final MaquinaRepository maquinas;
    private final MaquinaFotoRepository fotos;
    private final MaquinaConsumivelRepository consumiveis;
    private final MaquinaManutencaoRepository manutencoes;
    private final MaquinaManutencaoFotoRepository fotosManutencao;
    private final MaquinaDocumentoRepository documentos;
    private final MaquinaChecklistRepository checklist;
    private final BemPatrimonialRepository bens;
    private final NotaEntradaRepository notas;
    private final ClienteRepository clientes;
    private final OrdemServicoRepository ordens;
    private final Path raiz;

    public MaquinaFichaService(
            MaquinaRepository maquinas,
            MaquinaFotoRepository fotos,
            MaquinaConsumivelRepository consumiveis,
            MaquinaManutencaoRepository manutencoes,
            MaquinaManutencaoFotoRepository fotosManutencao,
            MaquinaDocumentoRepository documentos,
            MaquinaChecklistRepository checklist,
            BemPatrimonialRepository bens,
            NotaEntradaRepository notas,
            ClienteRepository clientes,
            OrdemServicoRepository ordens,
            @Value("${erp.uploads.dir:uploads}") String dir
    ) {
        this.maquinas = maquinas;
        this.fotos = fotos;
        this.consumiveis = consumiveis;
        this.manutencoes = manutencoes;
        this.fotosManutencao = fotosManutencao;
        this.documentos = documentos;
        this.checklist = checklist;
        this.bens = bens;
        this.notas = notas;
        this.clientes = clientes;
        this.ordens = ordens;
        this.raiz = Path.of(dir).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public List<Maquina> listar() {
        List<Maquina> lista = maquinas.findAll();
        lista.forEach(this::enriquecer);
        return lista;
    }

    @Transactional(readOnly = true)
    public Maquina buscar(Long id) {
        Maquina maquina = maquinas.findById(id).orElseThrow(() -> new IllegalArgumentException("Máquina não encontrada."));
        enriquecer(maquina);
        return maquina;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> ficha(Long id) {
        Maquina maquina = buscar(id);
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("maquina", maquina);
        corpo.put("fotos", fotos.findByMaquinaIdOrderByOrdemAscIdAsc(id));
        corpo.put("consumiveis", consumiveis.findByMaquinaIdOrderByIdAsc(id));
        List<Map<String, Object>> regs = new ArrayList<>();
        for (MaquinaManutencao item : manutencoes.findByMaquinaIdOrderByDataDescIdDesc(id)) {
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("id", item.getId());
            linha.put("data", item.getData());
            linha.put("tipo", item.getTipo());
            linha.put("descricao", item.getDescricao());
            linha.put("responsavel", item.getResponsavel());
            linha.put("custo", item.getCusto());
            linha.put("status", item.getStatus());
            linha.put("previsaoRetorno", item.getPrevisaoRetorno());
            linha.put("peca", item.getPeca());
            linha.put("fotos", fotosManutencao.findByManutencaoIdOrderByIdAsc(item.getId()));
            regs.add(linha);
        }
        corpo.put("manutencoes", regs);
        corpo.put("documentos", documentos.findByMaquinaIdOrderByIdAsc(id));
        corpo.put("checklist", listaChecklist(id));
        corpo.put("cronograma", cronograma(maquina));
        corpo.put("vinculos", vinculos(maquina));
        return corpo;
    }

    @Transactional
    public void prepararAcesso(Long id) {
        Maquina maquina = maquinas.findById(id).orElseThrow(() -> new IllegalArgumentException("Máquina não encontrada."));
        if (maquina.getCodigoPublico() == null || maquina.getCodigoPublico().isBlank()) {
            maquina.setCodigoPublico(novoCodigo());
            maquinas.save(maquina);
        }
        semearChecklist(maquina);
    }

    @Transactional
    public Map<String, Object> fichaPublica(String codigo) {
        Maquina maquina = porCodigo(codigo);
        prepararAcesso(maquina.getId());
        return montarPublica(maquinas.findById(maquina.getId()).orElseThrow());
    }

    @Transactional
    public Map<String, Object> marcarChecklist(String codigo, Long itemId, String responsavel) {
        Maquina maquina = porCodigo(codigo);
        MaquinaChecklist item = checklist.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item do checklist não encontrado."));
        if (!maquina.getId().equals(item.getMaquinaId())) {
            throw new IllegalArgumentException("Item não pertence a esta máquina.");
        }
        String nome = texto(responsavel, "Produção");
        if (nome.length() > 120) {
            nome = nome.substring(0, 120);
        }
        item.setUltimaExecucao(LocalDate.now());
        item.setResponsavel(nome);
        checklist.save(item);
        return montarPublica(maquina);
    }

    @Transactional
    public Maquina salvar(Long id, Maquina pedido) {
        Maquina alvo = id == null ? new Maquina() : maquinas.findById(id).orElseThrow(() -> new IllegalArgumentException("Máquina não encontrada."));
        aplicar(pedido, alvo);
        Maquina salva = maquinas.save(alvo);
        sincronizarBem(salva);
        return maquinas.save(salva);
    }

    @Transactional
    public void excluir(Long id) {
        Maquina maquina = maquinas.findById(id).orElseThrow(() -> new IllegalArgumentException("Máquina não encontrada."));
        for (MaquinaManutencao item : manutencoes.findByMaquinaIdOrderByDataDescIdDesc(id)) {
            for (MaquinaManutencaoFoto foto : fotosManutencao.findByManutencaoIdOrderByIdAsc(item.getId())) {
                apagarArquivo(foto.getArquivo());
                fotosManutencao.delete(foto);
            }
            manutencoes.delete(item);
        }
        for (MaquinaFoto foto : fotos.findByMaquinaIdOrderByOrdemAscIdAsc(id)) {
            apagarArquivo(foto.getArquivo());
            fotos.delete(foto);
        }
        for (MaquinaDocumento doc : documentos.findByMaquinaIdOrderByIdAsc(id)) {
            apagarArquivo(doc.getArquivo());
            documentos.delete(doc);
        }
        consumiveis.deleteAll(consumiveis.findByMaquinaIdOrderByIdAsc(id));
        checklist.deleteAll(checklist.findByMaquinaIdOrderByOrdemAscIdAsc(id));
        maquinas.delete(maquina);
    }

    @Transactional
    public MaquinaFoto salvarFoto(Long maquinaId, MultipartFile arquivo) throws Exception {
        exigir(maquinaId);
        validarImagem(arquivo);
        int ordem = fotos.findByMaquinaIdOrderByOrdemAscIdAsc(maquinaId).size();
        String publico = gravar(arquivo, Path.of("maquinas", String.valueOf(maquinaId)));
        MaquinaFoto foto = new MaquinaFoto();
        foto.setMaquinaId(maquinaId);
        foto.setArquivo(publico);
        foto.setLegenda("");
        foto.setOrdem(ordem);
        return fotos.save(foto);
    }

    @Transactional
    public void excluirFoto(Long maquinaId, Long fotoId) {
        MaquinaFoto foto = fotos.findById(fotoId).orElseThrow(() -> new IllegalArgumentException("Foto não encontrada."));
        if (!maquinaId.equals(foto.getMaquinaId())) {
            throw new IllegalArgumentException("Foto não pertence a esta máquina.");
        }
        apagarArquivo(foto.getArquivo());
        fotos.delete(foto);
    }

    @Transactional
    public List<MaquinaConsumivel> substituirConsumiveis(Long maquinaId, List<MaquinaConsumivel> itens) {
        exigir(maquinaId);
        consumiveis.deleteAll(consumiveis.findByMaquinaIdOrderByIdAsc(maquinaId));
        List<MaquinaConsumivel> salvos = new ArrayList<>();
        if (itens == null) {
            return salvos;
        }
        for (MaquinaConsumivel item : itens) {
            if (item == null || item.getNome() == null || item.getNome().isBlank()) {
                continue;
            }
            MaquinaConsumivel novo = new MaquinaConsumivel();
            novo.setMaquinaId(maquinaId);
            novo.setNome(item.getNome().trim());
            novo.setAtual(naoNegativo(item.getAtual()));
            novo.setCapacidade(naoNegativo(item.getCapacidade()));
            novo.setUnidade(texto(item.getUnidade(), "ml"));
            novo.setCor(texto(item.getCor(), "#6b7280"));
            salvos.add(consumiveis.save(novo));
        }
        return salvos;
    }

    @Transactional
    public MaquinaManutencao salvarManutencao(Long maquinaId, Long manutencaoId, MaquinaManutencao pedido) {
        exigir(maquinaId);
        if (pedido.getDescricao() == null || pedido.getDescricao().isBlank()) {
            throw new IllegalArgumentException("Descreva o registro de manutenção.");
        }
        MaquinaManutencao alvo = manutencaoId == null
                ? new MaquinaManutencao()
                : manutencoes.findById(manutencaoId).orElseThrow(() -> new IllegalArgumentException("Manutenção não encontrada."));
        if (manutencaoId != null && !maquinaId.equals(alvo.getMaquinaId())) {
            throw new IllegalArgumentException("Manutenção não pertence a esta máquina.");
        }
        alvo.setMaquinaId(maquinaId);
        alvo.setData(pedido.getData() == null ? LocalDate.now() : pedido.getData());
        alvo.setTipo(texto(pedido.getTipo(), "Corretiva"));
        alvo.setDescricao(pedido.getDescricao().trim());
        alvo.setResponsavel(texto(pedido.getResponsavel(), ""));
        alvo.setCusto(naoNegativo(pedido.getCusto()));
        alvo.setStatus(texto(pedido.getStatus(), "Em andamento"));
        alvo.setPrevisaoRetorno(pedido.getPrevisaoRetorno());
        alvo.setPeca(texto(pedido.getPeca(), ""));
        return manutencoes.save(alvo);
    }

    @Transactional
    public void excluirManutencao(Long maquinaId, Long manutencaoId) {
        MaquinaManutencao item = manutencoes.findById(manutencaoId).orElseThrow(() -> new IllegalArgumentException("Manutenção não encontrada."));
        if (!maquinaId.equals(item.getMaquinaId())) {
            throw new IllegalArgumentException("Manutenção não pertence a esta máquina.");
        }
        for (MaquinaManutencaoFoto foto : fotosManutencao.findByManutencaoIdOrderByIdAsc(manutencaoId)) {
            apagarArquivo(foto.getArquivo());
            fotosManutencao.delete(foto);
        }
        manutencoes.delete(item);
    }

    @Transactional
    public MaquinaManutencaoFoto salvarFotoManutencao(Long maquinaId, Long manutencaoId, MultipartFile arquivo) throws Exception {
        MaquinaManutencao item = manutencoes.findById(manutencaoId).orElseThrow(() -> new IllegalArgumentException("Manutenção não encontrada."));
        if (!maquinaId.equals(item.getMaquinaId())) {
            throw new IllegalArgumentException("Manutenção não pertence a esta máquina.");
        }
        validarImagem(arquivo);
        String publico = gravar(arquivo, Path.of("maquinas", String.valueOf(maquinaId), "manutencao", String.valueOf(manutencaoId)));
        MaquinaManutencaoFoto foto = new MaquinaManutencaoFoto();
        foto.setManutencaoId(manutencaoId);
        foto.setArquivo(publico);
        return fotosManutencao.save(foto);
    }

    @Transactional
    public void excluirFotoManutencao(Long maquinaId, Long manutencaoId, Long fotoId) {
        MaquinaManutencao item = manutencoes.findById(manutencaoId).orElseThrow(() -> new IllegalArgumentException("Manutenção não encontrada."));
        if (!maquinaId.equals(item.getMaquinaId())) {
            throw new IllegalArgumentException("Manutenção não pertence a esta máquina.");
        }
        MaquinaManutencaoFoto foto = fotosManutencao.findById(fotoId).orElseThrow(() -> new IllegalArgumentException("Foto não encontrada."));
        if (!manutencaoId.equals(foto.getManutencaoId())) {
            throw new IllegalArgumentException("Foto não pertence a este registro.");
        }
        apagarArquivo(foto.getArquivo());
        fotosManutencao.delete(foto);
    }

    @Transactional
    public MaquinaDocumento salvarDocumento(Long maquinaId, MultipartFile arquivo) throws Exception {
        exigir(maquinaId);
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione um arquivo.");
        }
        if (arquivo.getSize() > MAX) {
            throw new IllegalArgumentException("Arquivo acima de 8 MB.");
        }
        String mime = mime(arquivo);
        String nome = arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!DOCS.contains(mime) && !nome.endsWith(".pdf") && !nome.matches(".*\\.(jpg|jpeg|png|webp)$")) {
            throw new IllegalArgumentException("Anexe PDF, JPG, PNG ou WEBP.");
        }
        String publico = gravar(arquivo, Path.of("maquinas", String.valueOf(maquinaId), "docs"));
        MaquinaDocumento doc = new MaquinaDocumento();
        doc.setMaquinaId(maquinaId);
        doc.setNome(arquivo.getOriginalFilename());
        doc.setArquivo(publico);
        doc.setTipo(nome.endsWith(".pdf") || "application/pdf".equals(mime) ? "pdf" : "imagem");
        return documentos.save(doc);
    }

    @Transactional
    public void excluirDocumento(Long maquinaId, Long documentoId) {
        MaquinaDocumento doc = documentos.findById(documentoId).orElseThrow(() -> new IllegalArgumentException("Documento não encontrado."));
        if (!maquinaId.equals(doc.getMaquinaId())) {
            throw new IllegalArgumentException("Documento não pertence a esta máquina.");
        }
        apagarArquivo(doc.getArquivo());
        documentos.delete(doc);
    }

    private void aplicar(Maquina pedido, Maquina alvo) {
        if (pedido.getNome() == null || pedido.getNome().isBlank()) {
            throw new IllegalArgumentException("Informe o nome da máquina.");
        }
        String status = pedido.getStatus() == null ? "" : pedido.getStatus().trim().toLowerCase(Locale.ROOT);
        if (!status.equals("operacao") && !status.equals("manutencao") && !status.equals("inativa")) {
            status = "operacao";
        }
        if ("manutencao".equals(status) && pedido.getPrevisaoRetorno() == null) {
            throw new IllegalArgumentException("Com status em manutenção, informe a previsão de retorno.");
        }
        alvo.setNome(pedido.getNome().trim());
        alvo.setDetalhe(texto(pedido.getDetalhe(), ""));
        alvo.setTipo(texto(pedido.getTipo(), "Impressora"));
        alvo.setModelo(texto(pedido.getModelo(), ""));
        alvo.setMarca(texto(pedido.getMarca(), ""));
        alvo.setLocalizacao(texto(pedido.getLocalizacao(), ""));
        alvo.setStatus(status);
        alvo.setProxManutencao(pedido.getProxManutencao());
        alvo.setHorasUso(pedido.getHorasUso() == null || pedido.getHorasUso() < 0 ? 0 : pedido.getHorasUso());
        alvo.setBemId(pedido.getBemId());
        alvo.setNumeroSerie(texto(pedido.getNumeroSerie(), ""));
        alvo.setValorCompra(naoNegativo(pedido.getValorCompra()));
        alvo.setDataCompra(pedido.getDataCompra());
        alvo.setFornecedor(texto(pedido.getFornecedor(), ""));
        alvo.setFornecedorId(pedido.getFornecedorId());
        alvo.setNotaEntradaId(pedido.getNotaEntradaId());
        alvo.setNotaFiscal(texto(pedido.getNotaFiscal(), ""));
        alvo.setGarantiaAte(pedido.getGarantiaAte());
        alvo.setPrevisaoRetorno("manutencao".equals(status) ? pedido.getPrevisaoRetorno() : pedido.getPrevisaoRetorno());
        alvo.setUltimaUtilizacao(pedido.getUltimaUtilizacao());
        alvo.setEnergiaKwh(naoNegativo(pedido.getEnergiaKwh()));
        alvo.setEnergiaValor(naoNegativo(pedido.getEnergiaValor()));
        alvo.setMaterialMedia(naoNegativo(pedido.getMaterialMedia()));
        alvo.setMaterialUnidade(texto(pedido.getMaterialUnidade(), ""));
        alvo.setMaterialValor(naoNegativo(pedido.getMaterialValor()));
        alvo.setObservacao(texto(pedido.getObservacao(), ""));
        if (alvo.getCodigoPublico() == null || alvo.getCodigoPublico().isBlank()) {
            alvo.setCodigoPublico(novoCodigo());
        }
        if (alvo.getNotaEntradaId() != null && alvo.getNotaFiscal().isBlank()) {
            notas.findById(alvo.getNotaEntradaId()).ifPresent(nota -> alvo.setNotaFiscal(texto(nota.getNumeroNf(), "")));
        }
    }

    private void sincronizarBem(Maquina maquina) {
        BemPatrimonial bem = maquina.getBemId() == null
                ? new BemPatrimonial()
                : bens.findById(maquina.getBemId()).orElse(new BemPatrimonial());
        bem.setNome(maquina.getNome());
        bem.setTipo("EQUIPAMENTO");
        bem.setDescricao(juntar(maquina.getDetalhe(), maquina.getModelo(), maquina.getMarca()));
        bem.setValorAquisicao(maquina.getValorCompra() == null ? BigDecimal.ZERO : maquina.getValorCompra());
        bem.setDataAquisicao(maquina.getDataCompra());
        bem.setLocalizacao(maquina.getLocalizacao());
        if ("inativa".equals(maquina.getStatus())) {
            bem.setStatus("BAIXADO");
            if (bem.getDataBaixa() == null) {
                bem.setDataBaixa(LocalDate.now());
            }
        } else {
            bem.setStatus("ATIVO");
            bem.setDataBaixa(null);
        }
        String marca = "Cadastro de máquinas";
        if (bem.getObservacao() == null || bem.getObservacao().isBlank() || bem.getObservacao().startsWith(marca)) {
            String nota = maquina.getNotaFiscal() == null || maquina.getNotaFiscal().isBlank() ? "" : " · NF " + maquina.getNotaFiscal();
            bem.setObservacao(marca + " #" + maquina.getId() + nota);
        }
        BemPatrimonial salvo = bens.save(bem);
        maquina.setBemId(salvo.getId());
    }

    private Map<String, Object> vinculos(Maquina maquina) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        Map<String, Object> notaMap = null;
        if (maquina.getNotaEntradaId() != null) {
            NotaEntrada nota = notas.findById(maquina.getNotaEntradaId()).orElse(null);
            if (nota != null) {
                notaMap = new LinkedHashMap<>();
                notaMap.put("id", nota.getId());
                notaMap.put("numero", nota.getNumeroNf());
                notaMap.put("valor", nota.getValorTotal());
                notaMap.put("data", nota.getDataEntrada() != null ? nota.getDataEntrada().toLocalDate() : null);
                String fornecedor = maquina.getFornecedor();
                if (nota.getFornecedorId() != null) {
                    fornecedor = clientes.findById(nota.getFornecedorId()).map(Cliente::getNome).orElse(fornecedor);
                }
                notaMap.put("fornecedor", fornecedor);
            }
        }
        corpo.put("nota", notaMap);
        Map<String, Object> bemMap = null;
        if (maquina.getBemId() != null) {
            BemPatrimonial bem = bens.findById(maquina.getBemId()).orElse(null);
            if (bem != null) {
                bemMap = new LinkedHashMap<>();
                bemMap.put("id", bem.getId());
                bemMap.put("nome", bem.getNome());
                bemMap.put("status", bem.getStatus());
                bemMap.put("valor", bem.getValorAquisicao());
            }
        }
        corpo.put("bem", bemMap);
        List<Map<String, Object>> os = new ArrayList<>();
        try {
            String nome = maquina.getNome() == null ? "" : maquina.getNome();
            for (OrdemServico ordem : ordens.vincular(maquina.getId(), nome)) {
                Map<String, Object> linha = new LinkedHashMap<>();
                linha.put("id", ordem.getId());
                linha.put("numero", ordem.getNumero());
                linha.put("status", ordem.getStatus());
                linha.put("cliente", ordem.getCliente());
                linha.put("descricao", ordem.getDescricao());
                linha.put("equipamento", ordem.getEquipamento());
                linha.put("dataAbertura", ordem.getDataAbertura());
                linha.put("dataPrevisao", ordem.getDataPrevisao());
                os.add(linha);
            }
        } catch (Exception ignored) {
            /* vínculo de OS opcional */
        }
        corpo.put("ordens", os);
        return corpo;
    }

    private void enriquecer(Maquina maquina) {
        fotos.findFirstByMaquinaIdOrderByOrdemAscIdAsc(maquina.getId()).ifPresent(foto -> maquina.setFotoCapa(foto.getArquivo()));
        maquina.setQtdManutencoes(manutencoes.countByMaquinaId(maquina.getId()));
        List<MaquinaConsumivel> itens = consumiveis.findByMaquinaIdOrderByIdAsc(maquina.getId());
        double soma = 0;
        int n = 0;
        for (MaquinaConsumivel item : itens) {
            if (item.getCapacidade() != null && item.getCapacidade().signum() > 0 && item.getAtual() != null) {
                soma += item.getAtual().doubleValue() / item.getCapacidade().doubleValue() * 100;
                n++;
            }
        }
        maquina.setNivelMedio(n == 0 ? null : Math.round(soma / n * 10) / 10.0);
    }

    private void exigir(Long maquinaId) {
        if (!maquinas.existsById(maquinaId)) {
            throw new IllegalArgumentException("Máquina não encontrada.");
        }
    }

    private void validarImagem(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione uma imagem.");
        }
        if (arquivo.getSize() > MAX) {
            throw new IllegalArgumentException("Foto acima de 8 MB.");
        }
        String mime = mime(arquivo);
        String nome = arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!IMAGENS.contains(mime) && !nome.matches(".*\\.(jpg|jpeg|png|webp|gif)$")) {
            throw new IllegalArgumentException("Use JPG, PNG ou WEBP.");
        }
    }

    private String gravar(MultipartFile arquivo, Path relativo) throws Exception {
        Path pasta = raiz.resolve(relativo);
        Files.createDirectories(pasta);
        String ext = extensao(arquivo.getOriginalFilename(), mime(arquivo));
        String nome = UUID.randomUUID() + ext;
        arquivo.transferTo(pasta.resolve(nome).toFile());
        return "/uploads/" + relativo.toString().replace('\\', '/') + "/" + nome;
    }

    private void apagarArquivo(String publico) {
        if (publico == null || !publico.startsWith("/uploads/")) {
            return;
        }
        try {
            Files.deleteIfExists(raiz.resolve(publico.substring("/uploads/".length())));
        } catch (Exception ignored) {
            /* arquivo já removido */
        }
    }

    private String mime(MultipartFile arquivo) {
        String mime = arquivo.getContentType();
        return mime == null ? "" : mime.toLowerCase(Locale.ROOT);
    }

    private String extensao(String nome, String mime) {
        String original = nome == null ? "" : nome.toLowerCase(Locale.ROOT);
        if (original.endsWith(".png")) {
            return ".png";
        }
        if (original.endsWith(".webp")) {
            return ".webp";
        }
        if (original.endsWith(".gif")) {
            return ".gif";
        }
        if (original.endsWith(".pdf")) {
            return ".pdf";
        }
        if (original.endsWith(".jpg") || original.endsWith(".jpeg")) {
            return ".jpg";
        }
        if ("image/png".equals(mime)) {
            return ".png";
        }
        if ("image/webp".equals(mime)) {
            return ".webp";
        }
        if ("application/pdf".equals(mime)) {
            return ".pdf";
        }
        return ".jpg";
    }

    private BigDecimal naoNegativo(BigDecimal valor) {
        if (valor == null || valor.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return valor;
    }

    private String texto(String valor, String padrao) {
        if (valor == null || valor.isBlank()) {
            return padrao;
        }
        return valor.trim();
    }

    private Maquina porCodigo(String codigo) {
        if (codigo == null || !codigo.matches("[a-zA-Z0-9]{8,40}")) {
            throw new IllegalArgumentException("Código da máquina inválido.");
        }
        return maquinas.findByCodigoPublico(codigo).orElseThrow(() -> new IllegalArgumentException("Máquina não encontrada."));
    }

    private String novoCodigo() {
        for (int i = 0; i < 8; i++) {
            String codigo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            if (maquinas.findByCodigoPublico(codigo).isEmpty()) {
                return codigo;
            }
        }
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void semearChecklist(Maquina maquina) {
        if (!checklist.findByMaquinaIdOrderByOrdemAscIdAsc(maquina.getId()).isEmpty()) {
            return;
        }
        int ordem = 0;
        for (String[] par : modeloChecklist(maquina.getTipo())) {
            MaquinaChecklist item = new MaquinaChecklist();
            item.setMaquinaId(maquina.getId());
            item.setTitulo(par[0]);
            item.setPeriodicidade(par[1]);
            item.setOrdem(ordem++);
            checklist.save(item);
        }
    }

    private List<String[]> modeloChecklist(String tipo) {
        String nome = tipo == null ? "" : tipo.toLowerCase(Locale.ROOT);
        if (nome.contains("3d")) {
            return List.of(
                    new String[]{"Conferir nível de resina ou filamento", "diaria"},
                    new String[]{"Inspecionar filme FEP ou mesa de impressão", "semanal"},
                    new String[]{"Nivelar mesa ou eixo Z", "semanal"},
                    new String[]{"Filtrar resina e limpar o tanque", "mensal"},
                    new String[]{"Revisar tela, fonte e horas de uso", "trimestral"}
            );
        }
        if (nome.startsWith("impressora") || nome.startsWith("plotter") || nome.contains("tinta") || nome.contains("cartucho")) {
            return List.of(
                    new String[]{"Conferir o nível de tinta de cada cor", "diaria"},
                    new String[]{"Teste de bicos", "semanal"},
                    new String[]{"Limpar rolos, bandeja e área de impressão", "semanal"},
                    new String[]{"Alinhar o cabeçote", "mensal"},
                    new String[]{"Limpar a estação de manutenção", "mensal"}
            );
        }
        if (nome.contains("peça") || nome.contains("peca") || nome.contains("cabeça") || nome.contains("cabeca") || nome.contains("placa")) {
            return List.of(
                    new String[]{"Inspeção visual da peça", "mensal"},
                    new String[]{"Conferir compatibilidade e estoque", "mensal"}
            );
        }
        if (nome.contains("laser")) {
            return List.of(
                    new String[]{"Conferir exaustão e segurança da tampa", "diaria"},
                    new String[]{"Limpar lente e espelhos", "semanal"},
                    new String[]{"Verificar o foco", "semanal"},
                    new String[]{"Limpeza geral e conferir horas do tubo", "mensal"}
            );
        }
        return List.of(
                new String[]{"Limpeza geral do equipamento", "semanal"},
                new String[]{"Lubrificação e conferência de folgas", "mensal"},
                new String[]{"Teste dos itens de segurança", "mensal"},
                new String[]{"Conferir horas de uso", "mensal"}
        );
    }

    private List<Map<String, Object>> listaChecklist(Long maquinaId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        LocalDate hoje = LocalDate.now();
        for (MaquinaChecklist item : checklist.findByMaquinaIdOrderByOrdemAscIdAsc(maquinaId)) {
            LocalDate proxima = proximaChecklist(item);
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("id", item.getId());
            linha.put("titulo", item.getTitulo());
            linha.put("periodicidade", item.getPeriodicidade());
            linha.put("ultimaExecucao", item.getUltimaExecucao());
            linha.put("responsavel", item.getResponsavel());
            linha.put("proxima", proxima);
            linha.put("atrasado", proxima.isBefore(hoje));
            lista.add(linha);
        }
        return lista;
    }

    private LocalDate proximaChecklist(MaquinaChecklist item) {
        LocalDate base = item.getUltimaExecucao();
        if (base == null) {
            return LocalDate.now();
        }
        String periodo = item.getPeriodicidade() == null ? "mensal" : item.getPeriodicidade();
        return switch (periodo) {
            case "diaria" -> base.plusDays(1);
            case "semanal" -> base.plusWeeks(1);
            case "trimestral" -> base.plusMonths(3);
            default -> base.plusMonths(1);
        };
    }

    private List<Map<String, Object>> cronograma(Maquina maquina) {
        List<Map<String, Object>> lista = new ArrayList<>();
        addCron(lista, maquina.getProxManutencao(), "Preventiva programada", "Data prevista na ficha da máquina", "programacao");
        if ("manutencao".equals(maquina.getStatus())) {
            addCron(lista, maquina.getPrevisaoRetorno(), "Retorno da manutenção", "Previsão para a máquina voltar à operação", "retorno");
        }
        for (MaquinaManutencao item : manutencoes.findByMaquinaIdOrderByDataDescIdDesc(maquina.getId())) {
            String status = item.getStatus() == null ? "" : item.getStatus();
            if ("Concluída".equalsIgnoreCase(status)) {
                continue;
            }
            LocalDate data = item.getPrevisaoRetorno() != null ? item.getPrevisaoRetorno() : item.getData();
            String detalhe = texto(item.getDescricao(), item.getTipo() == null ? "" : item.getTipo());
            addCron(lista, data, texto(item.getTipo(), "Serviço") + (status.isBlank() ? "" : " · " + status), detalhe, "servico");
        }
        for (Map<String, Object> item : listaChecklist(maquina.getId())) {
            Object data = item.get("proxima");
            if (data instanceof LocalDate quando) {
                addCron(lista, quando, String.valueOf(item.get("titulo")), "Checklist " + item.get("periodicidade"), "checklist");
            }
        }
        lista.sort((a, b) -> String.valueOf(a.get("data")).compareTo(String.valueOf(b.get("data"))));
        return lista;
    }

    private void addCron(List<Map<String, Object>> lista, LocalDate data, String titulo, String detalhe, String origem) {
        if (data == null) {
            return;
        }
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("data", data);
        item.put("titulo", titulo);
        item.put("detalhe", detalhe);
        item.put("origem", origem);
        lista.add(item);
    }

    private Map<String, Object> montarPublica(Maquina maquina) {
        enriquecer(maquina);
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("codigo", maquina.getCodigoPublico());
        corpo.put("nome", maquina.getNome());
        corpo.put("detalhe", maquina.getDetalhe());
        corpo.put("tipo", maquina.getTipo());
        corpo.put("modelo", maquina.getModelo());
        corpo.put("marca", maquina.getMarca());
        corpo.put("numeroSerie", maquina.getNumeroSerie());
        corpo.put("localizacao", maquina.getLocalizacao());
        corpo.put("status", maquina.getStatus());
        corpo.put("horasUso", maquina.getHorasUso());
        corpo.put("ultimaUtilizacao", maquina.getUltimaUtilizacao());
        corpo.put("garantiaAte", maquina.getGarantiaAte());
        corpo.put("previsaoRetorno", maquina.getPrevisaoRetorno());
        corpo.put("proxManutencao", maquina.getProxManutencao());
        corpo.put("energiaKwh", maquina.getEnergiaKwh());
        corpo.put("materialMedia", maquina.getMaterialMedia());
        corpo.put("materialUnidade", maquina.getMaterialUnidade());
        corpo.put("observacao", maquina.getObservacao());
        corpo.put("fotoCapa", maquina.getFotoCapa());
        corpo.put("nivelMedio", maquina.getNivelMedio());
        List<Map<String, Object>> niveis = new ArrayList<>();
        for (MaquinaConsumivel item : consumiveis.findByMaquinaIdOrderByIdAsc(maquina.getId())) {
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("nome", item.getNome());
            linha.put("atual", item.getAtual());
            linha.put("capacidade", item.getCapacidade());
            linha.put("unidade", item.getUnidade());
            linha.put("cor", item.getCor());
            niveis.add(linha);
        }
        corpo.put("consumiveis", niveis);
        List<Map<String, Object>> regs = new ArrayList<>();
        for (MaquinaManutencao item : manutencoes.findByMaquinaIdOrderByDataDescIdDesc(maquina.getId())) {
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("data", item.getData());
            linha.put("tipo", item.getTipo());
            linha.put("descricao", item.getDescricao());
            linha.put("responsavel", item.getResponsavel());
            linha.put("status", item.getStatus());
            linha.put("previsaoRetorno", item.getPrevisaoRetorno());
            regs.add(linha);
        }
        corpo.put("manutencoes", regs);
        corpo.put("checklist", listaChecklist(maquina.getId()));
        corpo.put("cronograma", cronograma(maquina));
        return corpo;
    }

    private String juntar(String... partes) {
        StringBuilder sb = new StringBuilder();
        for (String parte : partes) {
            if (parte == null || parte.isBlank()) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append(" · ");
            }
            sb.append(parte.trim());
        }
        return sb.toString();
    }
}
