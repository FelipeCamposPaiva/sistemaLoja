package com.temdetudo.erp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.entity.AgendaEvento;
import com.temdetudo.erp.entity.Producao;
import com.temdetudo.erp.repository.AgendaEventoRepository;
import com.temdetudo.erp.repository.ProducaoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/producao")
@CrossOrigin("*")
public class ProducaoController {

    @Autowired
    private ProducaoRepository repository;

    @Autowired
    private AgendaEventoRepository agendaRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${erp.uploads.dir:uploads}")
    private String uploadsDir;

    @GetMapping
    public List<Producao> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public Producao buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public Producao salvar(
            @RequestBody Producao producao
    ) {

        if (producao.getStatus() == null) {

            producao.setStatus(
                    "ORCAMENTO"
            );

        }

        if (producao.getEtapa() == null) {

            producao.setEtapa(
                    producao.getStatus()
            );

        }

        if (producao.getPrioridade() == null) {

            producao.setPrioridade(
                    "NORMAL"
            );

        }

        producao.setCriadoEm(
                LocalDateTime.now()
        );
        producao.setNumero(proximoNumero(producao.getNumero()));

        return gravarComAgenda(producao);

    }

    @PutMapping("/{id}")
    public Producao atualizar(
            @PathVariable Long id,
            @RequestBody Producao dados
    ) {

        Producao producao =
                repository.findById(id)
                        .orElseThrow();

        producao.setCliente(
                dados.getCliente()
        );

        producao.setProduto(
                dados.getProduto()
        );

        producao.setQuantidade(
                dados.getQuantidade()
        );

        producao.setDataEntrega(
                dados.getDataEntrega()
        );

        producao.setPrioridade(
                dados.getPrioridade()
        );

        producao.setResponsavel(
                dados.getResponsavel()
        );

        if (dados.getSupervisor() != null) {
            producao.setSupervisor(dados.getSupervisor());
        }

        if (dados.getHora() != null) {
            producao.setHora(dados.getHora());
        }

        if (producao.getNumero() == null && dados.getNumero() != null) {
            producao.setNumero(dados.getNumero());
        }

        String statusAnterior = producao.getStatus();
        if (dados.getStatus() != null) {
            producao.setStatus(dados.getStatus());
            producao.setEtapa(
                    dados.getEtapa() != null
                            ? dados.getEtapa()
                            : dados.getStatus()
            );
        }
        if (dados.getInicio() != null) {
            producao.setInicio(dados.getInicio());
        }
        if (dados.getTermino() != null) {
            producao.setTermino(dados.getTermino());
        }
        marcarInstante(producao, statusAnterior);

        producao.setObservacao(
                dados.getObservacao()
        );

        producao.setLocalId(
                dados.getLocalId()
        );

        return gravarComAgenda(producao);

    }

    @PutMapping("/{id}/status")
    public Producao atualizarStatus(
            @PathVariable Long id,
            @RequestBody Producao dados
    ) {

        Producao producao =
                repository.findById(id)
                        .orElseThrow();

        String statusAntes = producao.getStatus();
        producao.setStatus(
                dados.getStatus()
        );

        producao.setEtapa(
                dados.getStatus()
        );

        marcarInstante(producao, statusAntes);

        return gravarComAgenda(producao);

    }

    @PostMapping(value = "/{id}/anexo", consumes = "multipart/form-data")
    public Map<String, String> anexar(
            @PathVariable Long id,
            @RequestPart("arquivo") MultipartFile arquivo
    ) throws Exception {
        repository.findById(id).orElseThrow();
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione um arquivo.");
        }
        String original = arquivo.getOriginalFilename() == null ? "anexo" : arquivo.getOriginalFilename();
        String seguro = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String nome = UUID.randomUUID() + "_" + seguro;
        Path pasta = Path.of(uploadsDir).toAbsolutePath().normalize().resolve("producao").resolve(String.valueOf(id));
        Files.createDirectories(pasta);
        Files.copy(arquivo.getInputStream(), pasta.resolve(nome));
        return Map.of(
                "nome", original,
                "url", "/uploads/producao/" + id + "/" + nome
        );
    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.findById(id).ifPresent(this::removerAgenda);
        repository.deleteById(id);

    }

    private Producao gravarComAgenda(Producao producao) {
        Producao salva = repository.save(producao);
        try {
            sincronizarAgenda(salva);
        } catch (Exception ignored) {
            /* a ordem permanece; a agenda é tentada de novo na próxima gravação */
        }
        return salva;
    }

    private void sincronizarAgenda(Producao producao) throws Exception {
        String executor = texto(producao.getResponsavel());
        String supervisor = texto(producao.getSupervisor());
        if (producao.getDataEntrega() == null || (executor.isBlank() && supervisor.isBlank())) {
            removerAgenda(producao);
            return;
        }

        AgendaEvento evento = producao.getAgendaEventoId() == null
                ? new AgendaEvento()
                : agendaRepository.findById(producao.getAgendaEventoId()).orElseGet(AgendaEvento::new);

        String produto = texto(producao.getProduto());
        String cliente = texto(producao.getCliente());
        String texto = "Ordem de produção"
                + (producao.getId() == null ? "" : " #" + producao.getId())
                + (produto.isBlank() ? "" : ": " + produto)
                + (cliente.isBlank() ? "" : " · " + cliente)
                + ". Executar: " + (executor.isBlank() ? "—" : executor)
                + ". Supervisor: " + (supervisor.isBlank() ? "—" : supervisor);
        if (texto.length() > 420) {
            texto = texto.substring(0, 417) + "...";
        }
        String titulo = "OP #" + producao.getId() + (produto.isBlank() ? "" : " " + produto);
        if (titulo.length() > 180) {
            titulo = titulo.substring(0, 177) + "...";
        }

        String[] hm = horaMin(producao.getHora());
        List<String> usuarios = new ArrayList<>();
        if (!executor.isBlank()) {
            usuarios.add(executor);
        }
        if (!supervisor.isBlank() && usuarios.stream().noneMatch(nome -> nome.equalsIgnoreCase(supervisor))) {
            usuarios.add(supervisor);
        }

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("texto", texto);
        extra.put("hora", hm[0]);
        extra.put("min", hm[1]);
        extra.put("usuarios", usuarios);
        extra.put("criadoPor", executor.isBlank() ? supervisor : executor);
        extra.put("google", false);
        extra.put("origem", "producao");
        extra.put("origemId", producao.getId());
        extra.put("href", "/ordens_producao#" + producao.getId());

        evento.setTitulo(titulo);
        evento.setTipo(tipoAgenda(producao.getStatus()));
        evento.setDataEvento(producao.getDataEntrega());
        evento.setDescricao(objectMapper.writeValueAsString(extra));
        evento.setCor("#3b82f6");
        evento = agendaRepository.save(evento);

        if (producao.getAgendaEventoId() == null || !producao.getAgendaEventoId().equals(evento.getId())) {
            producao.setAgendaEventoId(evento.getId());
            repository.save(producao);
        }
    }

    private void removerAgenda(Producao producao) {
        if (producao.getAgendaEventoId() == null) {
            return;
        }
        try {
            agendaRepository.deleteById(producao.getAgendaEventoId());
        } catch (Exception ignored) {
            /* compromisso já removido */
        }
        producao.setAgendaEventoId(null);
        if (producao.getId() != null) {
            repository.save(producao);
        }
    }

    private Integer proximoNumero(Integer pedido) {
        int proximo = repository.maiorNumero() + 1;
        if (pedido == null || pedido < proximo || repository.existsByNumero(pedido)) {
            return proximo;
        }
        return pedido;
    }

    private void marcarInstante(Producao producao, String statusAnterior) {
        LocalDateTime agora = LocalDateTime.now().withNano(0);
        if (aberto(statusAnterior) && andamento(producao.getStatus()) && producao.getInicio() == null) {
            producao.setInicio(agora);
        }
        if (!finalizada(statusAnterior) && finalizada(producao.getStatus()) && producao.getTermino() == null) {
            producao.setTermino(agora);
        }
    }

    private boolean aberto(String status) {
        String valor = status == null ? "" : status.toUpperCase();
        return valor.isBlank() || valor.equals("EM_ABERTO") || valor.equals("ORCAMENTO") || valor.equals("APROVADO");
    }

    private boolean andamento(String status) {
        String valor = status == null ? "" : status.toUpperCase();
        return valor.equals("EM_ANDAMENTO") || valor.equals("PRODUCAO") || valor.equals("ACABAMENTO") || valor.equals("ARTE");
    }

    private boolean finalizada(String status) {
        String valor = status == null ? "" : status.toUpperCase();
        return valor.equals("FINALIZADA") || valor.equals("PRONTO") || valor.equals("ENTREGUE");
    }

    private String tipoAgenda(String status) {
        String valor = status == null ? "" : status.toUpperCase();
        if (valor.contains("CANCEL")) {
            return "cancelado";
        }
        if (valor.equals("FINALIZADA") || valor.equals("PRONTO") || valor.equals("ENTREGUE")) {
            return "finalizado";
        }
        if (valor.equals("EM_ANDAMENTO") || valor.equals("PRODUCAO") || valor.equals("ACABAMENTO") || valor.equals("ARTE")) {
            return "em_andamento";
        }
        return "pendente";
    }

    private String[] horaMin(String hora) {
        if (hora == null || !hora.contains(":")) {
            return new String[]{"09", "00"};
        }
        String[] partes = hora.split(":");
        String h = partes[0].length() == 1 ? "0" + partes[0] : partes[0];
        String m = partes.length > 1 ? partes[1] : "00";
        if (m.length() == 1) {
            m = "0" + m;
        }
        return new String[]{h.substring(0, Math.min(2, h.length())), m.substring(0, Math.min(2, m.length()))};
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }

}