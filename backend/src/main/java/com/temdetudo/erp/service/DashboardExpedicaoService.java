package com.temdetudo.erp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.dto.DashboardExpedicaoDTO;
import com.temdetudo.erp.dto.DashboardExpedicaoDTO.Grupo;
import com.temdetudo.erp.dto.DashboardExpedicaoDTO.PedidoLinha;
import com.temdetudo.erp.entity.PedidoVenda;
import com.temdetudo.erp.repository.PedidoVendaRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DashboardExpedicaoService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final PedidoVendaRepository pedidoRepository;
    private final ObjectMapper mapper;

    public DashboardExpedicaoService(PedidoVendaRepository pedidoRepository, ObjectMapper mapper) {
        this.pedidoRepository = pedidoRepository;
        this.mapper = mapper;
    }

    public DashboardExpedicaoDTO montar() {
        DashboardExpedicaoDTO dto = new DashboardExpedicaoDTO();
        Map<String, Grupo> porEnvio = new LinkedHashMap<>();
        List<PedidoLinha> linhas = new ArrayList<>();
        LocalDate hoje = LocalDate.now();

        for (PedidoVenda pedido : pedidoRepository.findAll()) {
            if (cancelado(pedido)) {
                continue;
            }
            PedidoLinha linha = linhaDe(pedido);
            if ("ENTREGUE".equals(linha.getEtapa())) {
                if (pedido.getDataPedido() != null && pedido.getDataPedido().toLocalDate().equals(hoje)) {
                    dto.setEntreguesHoje(dto.getEntreguesHoje() + 1);
                }
                continue;
            }
            linhas.add(linha);
            switch (linha.getEtapa()) {
                case "SEPARAR" -> dto.setSeparar(dto.getSeparar() + 1);
                case "SEPARANDO" -> dto.setSeparando(dto.getSeparando() + 1);
                case "EMBALAR" -> dto.setEmbalar(dto.getEmbalar() + 1);
                case "AGUARDANDO_COLETA" -> dto.setAguardandoColeta(dto.getAguardandoColeta() + 1);
                case "EM_TRANSPORTE" -> dto.setEmTransporte(dto.getEmTransporte() + 1);
                default -> { }
            }
            if (linha.isParcial()) {
                dto.setParciais(dto.getParciais() + 1);
            }
            Grupo grupo = porEnvio.computeIfAbsent(linha.getFormaEnvio(), nome -> {
                Grupo g = new Grupo();
                g.setNome(nome);
                return g;
            });
            grupo.setTotal(grupo.getTotal() + 1);
            if ("AGUARDANDO_COLETA".equals(linha.getEtapa())) {
                grupo.setAguardandoColeta(grupo.getAguardandoColeta() + 1);
            } else if ("EM_TRANSPORTE".equals(linha.getEtapa())) {
                grupo.setEmTransporte(grupo.getEmTransporte() + 1);
            } else if ("SEPARAR".equals(linha.getEtapa()) || "SEPARANDO".equals(linha.getEtapa())) {
                grupo.setSeparar(grupo.getSeparar() + 1);
            }
        }

        linhas.sort(Comparator
                .comparing(PedidoLinha::getEtapa, Comparator.nullsLast(String::compareTo))
                .thenComparing(PedidoLinha::getDataLimiteDespacho, Comparator.nullsLast(String::compareTo))
                .thenComparing(PedidoLinha::getNumero, Comparator.nullsLast(String::compareToIgnoreCase)));
        dto.setPedidos(linhas);
        dto.setTransportadoras(porEnvio.values().stream()
                .sorted(Comparator.comparingLong(Grupo::getAguardandoColeta).reversed()
                        .thenComparing(Comparator.comparingLong(Grupo::getTotal).reversed())
                        .thenComparing(Grupo::getNome, String.CASE_INSENSITIVE_ORDER))
                .toList());
        return dto;
    }

    private PedidoLinha linhaDe(PedidoVenda pedido) {
        Map<String, Object> extra = extraDe(pedido);
        List<Map<String, Object>> itens = itensDe(extra, pedido);
        int pedida = 0;
        int feita = 0;
        int completos = 0;
        for (Map<String, Object> item : itens) {
            int qtd = Math.max(1, n(item.get("quantidade"), item.get("qtd")).intValue());
            int sep = n(item.get("qtdSeparada")).intValue();
            pedida += qtd;
            feita += Math.min(sep, qtd);
            if (sep >= qtd) {
                completos++;
            }
        }
        boolean parcial = pedida > 0 && feita > 0 && completos < itens.size();
        String separacao = texto(pedido.getSeparacao(), "PENDENTE").toUpperCase(PT);
        String expedicao = texto(pedido.getExpedicao(), "PENDENTE").toUpperCase(PT);
        String embalagem = texto(extra.get("embalagem"),
                "SEPARADO".equals(separacao) ? "AGUARDANDO" : "PENDENTE").toUpperCase(PT);
        String status = texto(pedido.getStatus(), "").toUpperCase(PT);

        PedidoLinha linha = new PedidoLinha();
        linha.setId(pedido.getId());
        linha.setNumero(pedido.getNumero());
        linha.setCliente(texto(pedido.getClienteNome(), "Cliente"));
        linha.setOrigem(texto(pedido.getOrigem(), "Loja"));
        linha.setFormaEnvio(texto(extra.get("formaEnvio"), extra.get("transportadora"), "Sem transportadora"));
        linha.setRastreio(texto(extra.get("rastreio"), ""));
        linha.setSeparacao(separacao);
        linha.setExpedicao(expedicao);
        linha.setEmbalagem(embalagem);
        linha.setStatus(status);
        linha.setParcial(parcial || "SEPARANDO".equals(separacao));
        linha.setItens(itens.size());
        linha.setItensSeparados(completos);
        linha.setPctSeparacao(pedida == 0 ? 0 : Math.round(feita * 100f / pedida));
        linha.setValor(pedido.getValorTotal() == null ? BigDecimal.ZERO : pedido.getValorTotal());
        linha.setDataPedido(pedido.getDataPedido() == null ? null : pedido.getDataPedido().format(ISO));
        linha.setDataLimiteDespacho(texto(extra.get("dataLimiteDespacho"), ""));
        linha.setEtapa(etapaDe(status, separacao, expedicao, embalagem, linha.isParcial()));
        return linha;
    }

    private String etapaDe(String status, String separacao, String expedicao, String embalagem, boolean parcial) {
        if ("ENTREGUE".equals(status)) {
            return "ENTREGUE";
        }
        if ("DESPACHADO".equals(expedicao) || "EM_TRANSPORTE".equals(expedicao) || "ENVIADO".equals(expedicao)) {
            return "EM_TRANSPORTE";
        }
        if ("EMBALADO".equals(embalagem) || "COLETA".equals(expedicao) || "AGUARDANDO_COLETA".equals(expedicao)) {
            return "AGUARDANDO_COLETA";
        }
        if ("SEPARADO".equals(separacao)) {
            return "EMBALAR";
        }
        if ("SEPARANDO".equals(separacao) || parcial) {
            return "SEPARANDO";
        }
        return "SEPARAR";
    }

    private boolean cancelado(PedidoVenda pedido) {
        String status = pedido.getStatus() == null ? "" : pedido.getStatus().toUpperCase(PT);
        return status.contains("CANCEL");
    }

    private Map<String, Object> extraDe(PedidoVenda pedido) {
        String bruto = pedido.getDetalhes();
        if (bruto == null || bruto.isBlank()) {
            return Map.of();
        }
        try {
            if (bruto.trim().startsWith("{")) {
                return mapper.readValue(bruto, new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception ignored) {
            /* detalhes inválido */
        }
        return Map.of();
    }

    private List<Map<String, Object>> itensDe(Map<String, Object> extra, PedidoVenda pedido) {
        Object itens = extra.get("itens");
        if (itens instanceof List<?>) {
            try {
                return mapper.convertValue(itens, new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
                return List.of();
            }
        }
        String bruto = pedido.getDetalhes();
        if (bruto != null && bruto.trim().startsWith("[")) {
            try {
                return mapper.readValue(bruto, new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
                /* ignore */
            }
        }
        return List.of();
    }

    private String texto(Object... valores) {
        for (Object valor : valores) {
            if (valor == null) {
                continue;
            }
            String s = String.valueOf(valor).trim();
            if (!s.isBlank() && !"null".equalsIgnoreCase(s)) {
                return s;
            }
        }
        return "";
    }

    private BigDecimal n(Object... valores) {
        for (Object valor : valores) {
            if (valor instanceof Number n) {
                return BigDecimal.valueOf(n.doubleValue());
            }
            if (valor != null) {
                try {
                    return new BigDecimal(String.valueOf(valor).replace(",", "."));
                } catch (Exception ignored) {
                    /* next */
                }
            }
        }
        return BigDecimal.ZERO;
    }
}
