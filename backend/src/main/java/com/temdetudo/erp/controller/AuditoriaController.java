package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.AuditoriaLog;
import com.temdetudo.erp.repository.AuditoriaRepository;
import com.temdetudo.erp.service.AuditoriaService;

import jakarta.annotation.PostConstruct;

import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin("*")
public class AuditoriaController {

    private final AuditoriaService auditoria;
    private final AuditoriaRepository repository;
    private final DataSource dataSource;

    public AuditoriaController(AuditoriaService auditoria, AuditoriaRepository repository, DataSource dataSource) {
        this.auditoria = auditoria;
        this.repository = repository;
        this.dataSource = dataSource;
    }

    @PostConstruct
    void criarTabela() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS auditoria_log (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      entidade VARCHAR(40) DEFAULT NULL,
                      registro_id BIGINT DEFAULT NULL,
                      registro_nome VARCHAR(255) DEFAULT NULL,
                      acao VARCHAR(20) DEFAULT NULL,
                      usuario_id BIGINT DEFAULT NULL,
                      usuario_login VARCHAR(80) DEFAULT NULL,
                      usuario_nome VARCHAR(150) DEFAULT NULL,
                      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                      alteracoes LONGTEXT,
                      PRIMARY KEY (id),
                      KEY idx_auditoria_entidade (entidade, registro_id),
                      KEY idx_auditoria_data (criado_em)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
        } catch (Exception ignored) {
            /* tabela já pode existir */
        }
    }

    @GetMapping
    public List<Map<String, Object>> listar(
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) Long registroId,
            @RequestParam(required = false) String q
    ) {
        List<AuditoriaLog> lista;
        if (entidade != null && !entidade.isBlank() && registroId != null) {
            lista = auditoria.doRegistro(entidade.toUpperCase(Locale.ROOT), registroId);
        } else if (entidade != null && !entidade.isBlank()) {
            lista = repository.findByEntidadeOrderByCriadoEmDesc(entidade.toUpperCase(Locale.ROOT));
        } else {
            lista = auditoria.recentes();
        }
        String termo = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> saida = new ArrayList<>();
        for (AuditoriaLog log : lista) {
            Map<String, Object> item = paraMapa(log);
            if (!termo.isEmpty()) {
                String blob = (log.getRegistroNome() + " " + log.getUsuarioNome() + " " + log.getUsuarioLogin()
                        + " " + log.getEntidade() + " " + log.getAlteracoes()).toLowerCase(Locale.ROOT);
                if (!blob.contains(termo)) {
                    continue;
                }
            }
            saida.add(item);
            if (saida.size() >= 300) {
                break;
            }
        }
        return saida;
    }

    @PostMapping
    public Map<String, Object> registrar(@RequestBody Map<String, Object> corpo) {
        String entidade = String.valueOf(corpo.getOrDefault("entidade", "OUTRO")).toUpperCase(Locale.ROOT);
        Long id = numero(corpo.get("registroId"));
        String nome = String.valueOf(corpo.getOrDefault("registroNome", ""));
        String acao = String.valueOf(corpo.getOrDefault("acao", "ALTERAR"));
        String resumo = String.valueOf(corpo.getOrDefault("resumo", "alteração registrada pela tela"));
        auditoria.registrarResumo(entidade, id, nome, acao, resumo);
        List<AuditoriaLog> logs = auditoria.doRegistro(entidade, id);
        return logs.isEmpty() ? Map.of() : paraMapa(logs.get(0));
    }

    private Map<String, Object> paraMapa(AuditoriaLog log) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", log.getId());
        item.put("entidade", log.getEntidade());
        item.put("registroId", log.getRegistroId());
        item.put("registroNome", log.getRegistroNome());
        item.put("acao", log.getAcao());
        item.put("usuarioId", log.getUsuarioId());
        item.put("usuarioLogin", log.getUsuarioLogin());
        item.put("usuarioNome", log.getUsuarioNome());
        item.put("criadoEm", log.getCriadoEm());
        item.put("alteracoes", log.getAlteracoes());
        return item;
    }

    private Long numero(Object valor) {
        if (valor == null) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(valor));
        } catch (Exception ignored) {
            return null;
        }
    }
}
