package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.StatusDTO;
import com.temdetudo.erp.entity.OrdemServico;
import com.temdetudo.erp.repository.OrdemServicoRepository;
import com.temdetudo.erp.service.AuditoriaService;

import jakarta.annotation.PostConstruct;

import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/os")
@CrossOrigin("*")
public class OrdemServicoController {

    private final OrdemServicoRepository repository;
    private final DataSource dataSource;
    private final AuditoriaService auditoria;

    public OrdemServicoController(OrdemServicoRepository repository, DataSource dataSource, AuditoriaService auditoria) {
        this.repository = repository;
        this.dataSource = dataSource;
        this.auditoria = auditoria;
    }

    @PostConstruct
    void ajustarColunas() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            executar(stmt, "ALTER TABLE ordens_servico MODIFY COLUMN status VARCHAR(40) NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN cliente_nome VARCHAR(255) NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN nome_fantasia VARCHAR(255) NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN equipamento VARCHAR(255) NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN maquina_id BIGINT NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN marcadores VARCHAR(255) NULL");
            executar(stmt, "ALTER TABLE ordens_servico ADD COLUMN detalhes LONGTEXT NULL");
        } catch (Exception ignored) {
            /* schema legado pode já ter as colunas */
        }
    }

    private void executar(java.sql.Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception ignored) {
            /* coluna já existe ou tipo já adequado */
        }
    }

    @GetMapping
    public List<OrdemServico> listar() {
        return repository.findAll();
    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(@RequestBody List<OrdemServico> itens) {
        int novos = 0;
        int atualizados = 0;
        int erros = 0;
        if (itens == null) {
            return resumo(0, 0, 0);
        }
        for (OrdemServico recebido : itens) {
            try {
                preparar(recebido, false);
                OrdemServico existente = localizar(recebido);
                if (existente == null) {
                    recebido.setId(null);
                    if (recebido.getNumero() == null) {
                        recebido.setNumero(proximoNumero());
                    }
                    repository.save(recebido);
                    auditoria.registrarResumo("OS", recebido.getId(), recebido.getCliente(), "CRIAR", "importação em lote");
                    novos++;
                    continue;
                }
                copiar(existente, recebido);
                repository.save(existente);
                auditoria.registrarResumo("OS", existente.getId(), existente.getCliente(), "ALTERAR", "atualizado na importação em lote");
                atualizados++;
            } catch (Exception ex) {
                erros++;
            }
        }
        return resumo(novos, atualizados, erros);
    }

    @GetMapping("/{id}")
    public OrdemServico buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public OrdemServico salvar(@RequestBody OrdemServico os) {
        preparar(os, true);
        os.setId(null);
        if (os.getNumero() == null) {
            os.setNumero(proximoNumero());
        }
        OrdemServico salvo = repository.save(os);
        auditoria.registrarCriacao("OS", salvo.getId(), nomeOs(salvo), salvo);
        return salvo;
    }

    @PutMapping("/{id}")
    public OrdemServico atualizar(@PathVariable Long id, @RequestBody OrdemServico os) {
        OrdemServico atual = repository.findById(id).orElseThrow();
        var antes = auditoria.snapshot(atual);
        os.setId(id);
        if (os.getNumero() == null) {
            os.setNumero(atual.getNumero());
        }
        preparar(os, false);
        OrdemServico salvo = repository.save(os);
        auditoria.registrarAlteracao("OS", id, nomeOs(salvo), antes, auditoria.snapshot(salvo));
        return salvo;
    }

    @PutMapping("/{id}/status")
    public OrdemServico atualizarStatus(
            @PathVariable Long id,
            @RequestBody StatusDTO dto) {
        OrdemServico os = repository.findById(id).orElseThrow();
        var antes = auditoria.snapshot(os);
        os.setStatus(limpar(dto.getStatus(), 40));
        if ("ENTREGUE".equals(os.getStatus()) && os.getDataConclusao() == null) {
            os.setDataConclusao(LocalDate.now());
        }
        OrdemServico salvo = repository.save(os);
        auditoria.registrarAlteracao("OS", id, nomeOs(salvo), antes, auditoria.snapshot(salvo));
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        OrdemServico anterior = repository.findById(id).orElse(null);
        repository.deleteById(id);
        if (anterior != null) {
            auditoria.registrarExclusao("OS", id, nomeOs(anterior), anterior);
        }
    }

    private String nomeOs(OrdemServico os) {
        String numero = os.getNumero() == null ? "" : String.valueOf(os.getNumero());
        String cliente = os.getCliente() == null ? "" : os.getCliente();
        return ("OS " + numero + " " + cliente).trim();
    }

    private OrdemServico localizar(OrdemServico recebido) {
        if (recebido.getId() != null) {
            return repository.findById(recebido.getId()).orElse(null);
        }
        if (recebido.getNumero() != null) {
            return repository.findFirstByNumero(recebido.getNumero()).orElse(null);
        }
        return null;
    }

    private void copiar(OrdemServico destino, OrdemServico origem) {
        destino.setClienteId(origem.getClienteId());
        destino.setCliente(origem.getCliente());
        destino.setNomeFantasia(origem.getNomeFantasia());
        destino.setEquipamento(origem.getEquipamento());
        if (origem.getMaquinaId() != null) {
            destino.setMaquinaId(origem.getMaquinaId());
        }
        destino.setMarcadores(origem.getMarcadores());
        destino.setTelefone(origem.getTelefone());
        destino.setWhatsapp(origem.getWhatsapp());
        destino.setDescricao(origem.getDescricao());
        destino.setValor(origem.getValor());
        destino.setStatus(origem.getStatus());
        destino.setDataAbertura(origem.getDataAbertura());
        destino.setDataPrevisao(origem.getDataPrevisao());
        destino.setDataConclusao(origem.getDataConclusao());
        destino.setDataEntrega(origem.getDataEntrega());
        destino.setCategoria(origem.getCategoria());
        destino.setFormaPagamento(origem.getFormaPagamento());
        destino.setResponsavel(origem.getResponsavel());
        destino.setObservacoes(origem.getObservacoes());
        destino.setArquivoArte(origem.getArquivoArte());
        destino.setDetalhes(origem.getDetalhes());
        destino.setPrioridade(origem.getPrioridade());
    }

    private void preparar(OrdemServico os, boolean novo) {
        os.setCliente(limpar(os.getCliente(), 255));
        os.setNomeFantasia(limpar(os.getNomeFantasia(), 255));
        os.setEquipamento(limpar(os.getEquipamento(), 255));
        os.setMarcadores(limpar(os.getMarcadores(), 255));
        os.setTelefone(limpar(os.getTelefone(), 30));
        os.setWhatsapp(limpar(os.getWhatsapp(), 30));
        os.setStatus(limpar(os.getStatus(), 40));
        if (os.getStatus() == null || os.getStatus().isBlank()) {
            os.setStatus("EM_ABERTO");
        }
        os.setCategoria(limpar(os.getCategoria(), 100));
        os.setFormaPagamento(limpar(os.getFormaPagamento(), 50));
        os.setResponsavel(limpar(os.getResponsavel(), 100));
        String prioridade = limpar(os.getPrioridade(), 20);
        if (prioridade == null || !List.of("HIGH", "MEDIA", "BAIXA").contains(prioridade)) {
            os.setPrioridade("MEDIA");
        } else {
            os.setPrioridade(prioridade);
        }
        if (os.getValor() == null) {
            os.setValor(0.0);
        }
        if (novo && os.getDataAbertura() == null) {
            os.setDataAbertura(LocalDate.now());
        }
    }

    private Integer proximoNumero() {
        return repository.findTopByOrderByNumeroDesc()
                .map(OrdemServico::getNumero)
                .map(n -> n + 1)
                .orElse(1);
    }

    private String limpar(String valor, int max) {
        if (valor == null) {
            return null;
        }
        String t = valor.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }

    private Map<String, Integer> resumo(int novos, int atualizados, int erros) {
        Map<String, Integer> saida = new HashMap<>();
        saida.put("novos", novos);
        saida.put("atualizados", atualizados);
        saida.put("erros", erros);
        saida.put("total", novos + atualizados);
        return saida;
    }
}
