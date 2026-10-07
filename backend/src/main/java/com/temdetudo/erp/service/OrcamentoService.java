package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.Orcamento;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.repository.OrcamentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class OrcamentoService {

    private final OrcamentoRepository repository;
    private final ClienteRepository clientes;

    public OrcamentoService(OrcamentoRepository repository, ClienteRepository clientes) {
        this.repository = repository;
        this.clientes = clientes;
    }

    public List<Orcamento> listar() {
        return repository.findAll().stream().map(this::exibir).toList();
    }

    @Transactional
    public Orcamento salvar(Orcamento orcamento) {
        preparar(orcamento);
        if (orcamento.getNumero() == null || orcamento.getNumero().isBlank()) {
            orcamento.setNumero(proximoNumero());
        }
        return exibir(repository.save(orcamento));
    }

    @Transactional
    public Orcamento atualizar(Long id, Orcamento recebido) {
        Orcamento atual = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Orçamento não encontrado."));
        copiar(atual, recebido);
        preparar(atual);
        return exibir(repository.save(atual));
    }

    @Transactional
    public void excluir(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public Map<String, Integer> importar(List<Orcamento> itens) {
        int novos = 0;
        int atualizados = 0;
        int erros = 0;
        if (itens != null) {
            for (Orcamento recebido : itens) {
                try {
                    if (recebido == null || (texto(recebido.getClienteNome()).isBlank() && texto(recebido.getNumero()).isBlank())) {
                        erros++;
                        continue;
                    }
                    preparar(recebido);
                    Orcamento existente = texto(recebido.getNumero()).isBlank()
                            ? null
                            : repository.findFirstByNumero(recebido.getNumero().trim()).orElse(null);
                    if (existente == null) {
                        recebido.setId(null);
                        if (texto(recebido.getNumero()).isBlank()) {
                            recebido.setNumero(proximoNumero());
                        }
                        repository.save(recebido);
                        novos++;
                    } else {
                        copiar(existente, recebido);
                        preparar(existente);
                        repository.save(existente);
                        atualizados++;
                    }
                } catch (Exception ex) {
                    erros++;
                }
            }
        }
        Map<String, Integer> resumo = new LinkedHashMap<>();
        resumo.put("novos", novos);
        resumo.put("atualizados", atualizados);
        resumo.put("erros", erros);
        resumo.put("total", novos + atualizados);
        return resumo;
    }

    private Orcamento exibir(Orcamento origem) {
        Orcamento copia = new Orcamento();
        copia.setId(origem.getId());
        copia.setNumero(origem.getNumero());
        copia.setClienteId(origem.getClienteId());
        copia.setClienteNome(origem.getClienteNome());
        copia.setNomeFantasia(origem.getNomeFantasia());
        copia.setValor(origem.getValor());
        copia.setObservacoes(origem.getObservacoes());
        copia.setStatus(origem.getStatus());
        copia.setDataOrcamento(origem.getDataOrcamento());
        copia.setVendedor(origem.getVendedor());
        copia.setEmailEnviado(origem.getEmailEnviado());
        if (copia.getClienteId() != null && (texto(copia.getClienteNome()).isBlank() || texto(copia.getNomeFantasia()).isBlank())) {
            clientes.findById(copia.getClienteId()).ifPresent((cliente) -> completarCliente(copia, cliente));
        }
        return copia;
    }

    private void preparar(Orcamento orcamento) {
        if (orcamento.getClienteNome() != null) {
            orcamento.setClienteNome(orcamento.getClienteNome().trim());
        }
        if (orcamento.getNumero() != null) {
            orcamento.setNumero(orcamento.getNumero().trim());
        }
        if (orcamento.getNomeFantasia() != null) {
            orcamento.setNomeFantasia(orcamento.getNomeFantasia().trim());
        }
        if (orcamento.getVendedor() != null) {
            orcamento.setVendedor(orcamento.getVendedor().trim());
        }
        orcamento.setStatus(normalizarStatus(orcamento.getStatus()));
        if (orcamento.getValor() == null) {
            orcamento.setValor(BigDecimal.ZERO);
        }
        if (orcamento.getDataOrcamento() == null) {
            orcamento.setDataOrcamento(LocalDateTime.now());
        }
        if (orcamento.getEmailEnviado() == null) {
            orcamento.setEmailEnviado(Boolean.FALSE);
        }
        if (orcamento.getClienteId() == null && !texto(orcamento.getClienteNome()).isBlank()) {
            clientes.findFirstByNomeIgnoreCase(orcamento.getClienteNome()).ifPresent((cliente) -> {
                orcamento.setClienteId(cliente.getId());
                completarCliente(orcamento, cliente);
            });
        }
    }

    private void completarCliente(Orcamento orcamento, Cliente cliente) {
        if (texto(orcamento.getClienteNome()).isBlank()) {
            orcamento.setClienteNome(cliente.getNome());
        }
        if (texto(orcamento.getNomeFantasia()).isBlank()) {
            orcamento.setNomeFantasia(cliente.getNomeFantasia());
        }
        if (texto(orcamento.getVendedor()).isBlank()) {
            orcamento.setVendedor(cliente.getVendedor());
        }
    }

    private void copiar(Orcamento destino, Orcamento origem) {
        destino.setNumero(origem.getNumero());
        destino.setClienteId(origem.getClienteId());
        destino.setClienteNome(origem.getClienteNome());
        destino.setNomeFantasia(origem.getNomeFantasia());
        destino.setValor(origem.getValor());
        destino.setObservacoes(origem.getObservacoes());
        destino.setStatus(origem.getStatus());
        destino.setDataOrcamento(origem.getDataOrcamento());
        destino.setVendedor(origem.getVendedor());
        destino.setEmailEnviado(origem.getEmailEnviado());
    }

    private String proximoNumero() {
        int maior = repository.findAll().stream()
                .map(Orcamento::getNumero)
                .map(this::inteiro)
                .max(Integer::compareTo)
                .orElse(0);
        return String.valueOf(maior + 1);
    }

    private int inteiro(String numero) {
        if (numero == null) {
            return 0;
        }
        String digitos = numero.replaceAll("\\D", "");
        if (digitos.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(digitos);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private String normalizarStatus(String status) {
        String chave = texto(status)
                .toLowerCase(Locale.ROOT)
                .replace("ç", "c")
                .replace("ã", "a")
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u");
        return switch (chave) {
            case "", "em aberto", "aberto", "em_aberto" -> "em_aberto";
            case "rascunho", "rascunhos" -> "rascunho";
            case "pendente", "pendentes" -> "pendente";
            case "aguardando" -> "aguardando";
            case "aprovada", "aprovado", "aprovadas", "aprovados" -> "aprovada";
            case "nao aprovada", "nao aprovado", "nao_aprovada", "recusada", "recusado" -> "nao_aprovada";
            case "concluida", "concluido", "concluidas" -> "concluida";
            case "modelo", "modelos" -> "modelo";
            default -> chave.replace(' ', '_');
        };
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
