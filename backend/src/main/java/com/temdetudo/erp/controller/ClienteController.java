package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.service.AuditoriaService;
import com.temdetudo.erp.service.NaturezaOperacaoService;
import com.temdetudo.erp.dto.NaturezaSugeridaDTO;

import jakarta.annotation.PostConstruct;

import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin("*")
public class ClienteController {

    private final ClienteRepository repository;
    private final DataSource dataSource;
    private final AuditoriaService auditoria;
    private final NaturezaOperacaoService naturezaService;

    public ClienteController(
            ClienteRepository repository,
            DataSource dataSource,
            AuditoriaService auditoria,
            NaturezaOperacaoService naturezaService
    ) {
        this.repository = repository;
        this.dataSource = dataSource;
        this.auditoria = auditoria;
        this.naturezaService = naturezaService;
    }

    @PostConstruct
    void ajustarColunaTipo() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            stmt.execute("ALTER TABLE clientes MODIFY COLUMN tipo VARCHAR(80) NULL");
        } catch (Exception ignored) {
            /* coluna já pode ser VARCHAR */
        }
    }

    @GetMapping
    public List<Cliente> listar() {
        return repository.findAll();
    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(@RequestBody List<Cliente> itens) {
        int novos = 0;
        int atualizados = 0;
        int erros = 0;

        if (itens == null) {
            return resumo(0, 0, 0);
        }

        for (Cliente recebido : itens) {
            if (recebido == null || recebido.getNome() == null || recebido.getNome().isBlank()) {
                continue;
            }
            if (recebido.getAtivo() == null) {
                recebido.setAtivo(true);
            }
            preparar(recebido);
            try {
                Cliente existente = localizar(recebido);
                if (existente == null) {
                    recebido.setId(null);
                    Cliente salvo = repository.save(recebido);
                    auditoria.registrarResumo("CLIENTE", salvo.getId(), salvo.getNome(), "CRIAR", "importação em lote");
                    novos++;
                    continue;
                }
                copiar(existente, recebido);
                repository.save(existente);
                auditoria.registrarResumo("CLIENTE", existente.getId(), existente.getNome(), "ALTERAR", "atualizado na importação em lote");
                atualizados++;
            } catch (Exception ex) {
                erros++;
            }
        }

        return resumo(novos, atualizados, erros);
    }

    @GetMapping("/{id}")
    public Cliente buscar(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }

    @GetMapping("/{id}/natureza-operacao")
    public NaturezaSugeridaDTO natureza(@PathVariable Long id) {
        return naturezaService.sugerir(repository.findById(id).orElseThrow());
    }

    @PostMapping
    public Cliente salvar(@RequestBody Cliente cliente) {
        if (cliente.getAtivo() == null) {
            cliente.setAtivo(true);
        }
        preparar(cliente);
        Cliente salvo = repository.save(cliente);
        auditoria.registrarCriacao("CLIENTE", salvo.getId(), salvo.getNome(), salvo);
        return salvo;
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Long id, @RequestBody Cliente cliente) {
        Cliente anterior = repository.findById(id).orElseThrow();
        var antes = auditoria.snapshot(anterior);
        cliente.setId(id);
        preparar(cliente);
        Cliente salvo = repository.save(cliente);
        auditoria.registrarAlteracao("CLIENTE", id, salvo.getNome(), antes, auditoria.snapshot(salvo));
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        Cliente anterior = repository.findById(id).orElse(null);
        repository.deleteById(id);
        if (anterior != null) {
            auditoria.registrarExclusao("CLIENTE", id, anterior.getNome(), anterior);
        }
    }

    private Map<String, Integer> resumo(int novos, int atualizados, int erros) {
        Map<String, Integer> saida = new HashMap<>();
        saida.put("novos", novos);
        saida.put("atualizados", atualizados);
        saida.put("total", novos + atualizados);
        saida.put("erros", erros);
        return saida;
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

    private void preparar(Cliente cliente) {
        cliente.setNome(limpar(cliente.getNome(), 150));
        cliente.setCpfCnpj(limpar(cliente.getCpfCnpj(), 20));
        cliente.setTelefone(limpar(cliente.getTelefone(), 20));
        cliente.setEmail(limpar(cliente.getEmail(), 150));
        cliente.setTipo(limpar(cliente.getTipo(), 80));
        cliente.setNomeFantasia(limpar(cliente.getNomeFantasia(), 255));
        cliente.setCidade(limpar(cliente.getCidade(), 100));
        String uf = limpar(cliente.getEstado(), 2);
        cliente.setEstado(uf == null ? null : uf.toUpperCase());
        cliente.setCep(limpar(cliente.getCep(), 10));
        cliente.setTipoPessoa(limpar(cliente.getTipoPessoa(), 20));
        cliente.setContribuinte(limpar(cliente.getContribuinte(), 2));
        cliente.setIe(limpar(cliente.getIe(), 30));
        cliente.setFinalidade(limpar(cliente.getFinalidade(), 20));
        cliente.setRegimeTributario(limpar(cliente.getRegimeTributario(), 30));
        if (cliente.getConsumidorFinal() == null) {
            cliente.setConsumidorFinal(!"1".equals(cliente.getContribuinte()));
        }
        if (cliente.getLimiteCredito() == null) {
            cliente.setLimiteCredito(BigDecimal.ZERO);
        }
    }

    private Cliente localizar(Cliente recebido) {
        if (recebido.getTinyId() != null) {
            var porTiny = repository.findFirstByTinyId(recebido.getTinyId());
            if (porTiny.isPresent()) {
                return porTiny.get();
            }
        }
        if (recebido.getCpfCnpj() != null && !recebido.getCpfCnpj().isBlank()) {
            return repository.findFirstByCpfCnpj(recebido.getCpfCnpj().trim()).orElse(null);
        }
        return null;
    }

    private void copiar(Cliente destino, Cliente origem) {
        destino.setNome(origem.getNome());
        if (origem.getCpfCnpj() != null) {
            destino.setCpfCnpj(origem.getCpfCnpj());
        }
        destino.setTelefone(origem.getTelefone());
        destino.setEmail(origem.getEmail());
        destino.setEndereco(origem.getEndereco());
        destino.setTipo(origem.getTipo());
        destino.setNomeFantasia(origem.getNomeFantasia());
        destino.setCidade(origem.getCidade());
        destino.setEstado(origem.getEstado());
        destino.setCep(origem.getCep());
        destino.setLimiteCredito(origem.getLimiteCredito());
        destino.setObservacoes(origem.getObservacoes());
        destino.setAtivo(origem.getAtivo());
        destino.setTipoPessoa(origem.getTipoPessoa());
        destino.setContribuinte(origem.getContribuinte());
        destino.setIe(origem.getIe());
        destino.setConsumidorFinal(origem.getConsumidorFinal());
        destino.setFinalidade(origem.getFinalidade());
        destino.setRegimeTributario(origem.getRegimeTributario());
        destino.setNaturezaOperacaoId(origem.getNaturezaOperacaoId());
        if (origem.getTinyId() != null) {
            destino.setTinyId(origem.getTinyId());
        }
    }

}
