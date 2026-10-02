package com.temdetudo.erp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.dto.DashboardVendasDTO;
import com.temdetudo.erp.dto.DashboardVendasDTO.EstadoLinha;
import com.temdetudo.erp.dto.DashboardVendasDTO.Grupo;
import com.temdetudo.erp.dto.DashboardVendasDTO.Ponto;
import com.temdetudo.erp.dto.DashboardVendasDTO.ProdutoLinha;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.PedidoVenda;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.repository.PedidoVendaRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class DashboardVendasService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM", PT);
    private static final Set<String> ORIGENS_ECOMMERCE = Set.of(
            "SHOPEE", "MERCADO LIVRE", "MERCADOLIVRE",
            "NUVEMSHOP", "ECOMMERCE", "E-COMMERCE", "SITE", "LOJA VIRTUAL", "LOJA INTEGRADA"
    );

    private final PedidoVendaRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ObjectMapper mapper;

    public DashboardVendasService(
            PedidoVendaRepository pedidoRepository,
            ClienteRepository clienteRepository,
            ObjectMapper mapper
    ) {
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
        this.mapper = mapper;
    }

    public DashboardVendasDTO montar(String periodoPedido, Integer diasPedido) {
        LocalDate hoje = LocalDate.now();
        String periodo = periodoPedido == null || periodoPedido.isBlank() ? "mes" : periodoPedido.trim().toLowerCase(PT);
        LocalDate inicio;
        LocalDate inicioAnterior;
        LocalDate fimAnterior;
        int dias;
        if ("mes".equals(periodo) && diasPedido == null) {
            inicio = hoje.withDayOfMonth(1);
            fimAnterior = inicio.minusDays(1);
            inicioAnterior = fimAnterior.withDayOfMonth(1);
            dias = (int) ChronoUnit.DAYS.between(inicio, hoje) + 1;
        } else {
            dias = Math.min(180, Math.max(7, diasPedido == null ? parseDias(periodo) : diasPedido));
            inicio = hoje.minusDays(dias - 1L);
            inicioAnterior = inicio.minusDays(dias);
            fimAnterior = inicio.minusDays(1);
            periodo = String.valueOf(dias);
        }

        Map<Integer, Cliente> clientes = new HashMap<>();
        for (Cliente cliente : clienteRepository.findAll()) {
            if (cliente.getId() != null) {
                clientes.put(cliente.getId().intValue(), cliente);
            }
        }

        Map<LocalDate, Acc> porDia = new LinkedHashMap<>();
        for (LocalDate d = inicio; !d.isAfter(hoje); d = d.plusDays(1)) {
            porDia.put(d, new Acc());
        }
        Acc atual = new Acc();
        Acc anterior = new Acc();
        Map<Integer, Acc> porHora = new HashMap<>();
        Map<String, Acc> porProduto = new HashMap<>();
        Map<String, Acc> porProdutoAnt = new HashMap<>();
        Map<String, Acc> porUf = new HashMap<>();
        Map<String, Acc> porOrigem = new HashMap<>();
        long ecommerce = 0;
        long fisicas = 0;
        long nfe = 0;
        long devolucoes = 0;

        LocalDateTime corte = inicioAnterior.atStartOfDay();
        for (PedidoVenda pedido : pedidoRepository.findByDataPedidoGreaterThanEqual(corte)) {
            if (pedido.getDataPedido() == null) {
                continue;
            }
            LocalDate dia = pedido.getDataPedido().toLocalDate();
            boolean neste = !dia.isBefore(inicio) && !dia.isAfter(hoje);
            boolean noAnterior = !dia.isBefore(inicioAnterior) && !dia.isAfter(fimAnterior);
            if (!neste && !noAnterior) {
                continue;
            }

            if (devolucao(pedido)) {
                if (neste) {
                    devolucoes++;
                    Acc doDia = porDia.get(dia);
                    if (doDia != null) {
                        doDia.dev++;
                    }
                }
                continue;
            }
            if (!vendaValida(pedido)) {
                continue;
            }

            BigDecimal valor = n(pedido.getValorTotal());
            if (neste) {
                atual.add(valor);
                Acc doDia = porDia.get(dia);
                if (doDia != null) {
                    doDia.add(valor);
                }
                porHora.computeIfAbsent(pedido.getDataPedido().getHour(), k -> new Acc()).add(valor);
                String canal = canalDe(pedido);
                porOrigem.computeIfAbsent(canal, k -> new Acc()).add(valor);
                if (ecommerce(canal)) {
                    ecommerce++;
                } else {
                    fisicas++;
                }
                if (temNota(pedido)) {
                    nfe++;
                }
                String uf = ufDe(pedido, clientes);
                if (!uf.isBlank()) {
                    porUf.computeIfAbsent(uf, k -> new Acc()).add(valor);
                }
                for (Map<String, Object> item : itensDe(pedido)) {
                    somarItem(porProduto, item);
                }
            } else {
                anterior.add(valor);
                for (Map<String, Object> item : itensDe(pedido)) {
                    somarItem(porProdutoAnt, item);
                }
            }
        }

        List<Ponto> serieVendas = serieSemanal(porDia, false);
        List<Ponto> serieTicket = serieSemanal(porDia, true);
        List<Ponto> serieDev = serieContagem(porDia);

        DashboardVendasDTO dto = new DashboardVendasDTO();
        dto.setPeriodo(periodo);
        dto.setDias(dias);
        dto.setAtualizadoEm(LocalDateTime.now().toString());
        dto.setPedidos(atual.qtd);
        dto.setTotalVendas(atual.valor);
        dto.setTotalAnterior(anterior.valor);
        dto.setVariacaoVendas(variacao(atual.valor, anterior.valor));
        dto.setTicketMedio(ticket(atual));
        dto.setTicketAnterior(ticket(anterior));
        dto.setVariacaoTicket(variacao(ticket(atual), ticket(anterior)));
        dto.setSerieVendas(serieVendas);
        dto.setSerieTicket(serieTicket);
        dto.setSerieDevolucoes(serieDev);
        dto.setEixoMinVendas(eixoMin(serieVendas));
        dto.setEixoMaxTicket(eixoMax(serieTicket, ticket(atual)));
        dto.setVendasEcommerce(ecommerce);
        dto.setVendasFisicas(fisicas);
        dto.setNfeEmitidas(nfe);
        List<Grupo> integracoes = integracoesDe(porOrigem);
        dto.setIntegracoes(integracoes);
        dto.setIntegracaoAlta(integracoes.isEmpty() ? "" : integracoes.get(0).getNome());
        dto.setProdutos(topProdutos(porProduto, porProdutoAnt));
        dto.setHorarios(horariosDe(porHora));
        dto.setVendasQtd(atual.qtd);
        dto.setDevolucoesQtd(devolucoes);
        dto.setEstados(estadosDe(porUf));
        return dto;
    }

    private int parseDias(String periodo) {
        try {
            return Integer.parseInt(periodo.replaceAll("\\D", ""));
        } catch (Exception ex) {
            return 30;
        }
    }

    private void somarItem(Map<String, Acc> destino, Map<String, Object> item) {
        BigDecimal qtd = primeiroPositivo(item.get("quantidade"), item.get("qtd"));
        if (qtd.compareTo(BigDecimal.ZERO) <= 0) {
            qtd = BigDecimal.ONE;
        }
        String nome = texto(item.get("nome"), item.get("produtoNome"), item.get("descricao"), item.get("sku"));
        if (nome.isBlank()) {
            nome = "Item sem nome";
        }
        destino.computeIfAbsent(nome, k -> new Acc()).addQtd(qtd);
    }

    private List<Ponto> serieSemanal(Map<LocalDate, Acc> porDia, boolean usarTicket) {
        LinkedHashMap<String, Acc> semanas = new LinkedHashMap<>();
        if (porDia.isEmpty()) {
            return List.of();
        }
        LocalDate first = porDia.keySet().iterator().next();
        LocalDate last = first;
        for (LocalDate d : porDia.keySet()) {
            last = d;
        }
        LocalDate cursor = first;
        while (!cursor.isAfter(last)) {
            LocalDate fim = cursor.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            if (fim.isAfter(last)) {
                fim = last;
            }
            String rotulo = cursor.equals(fim) ? cursor.format(DIA) : cursor.format(DIA) + " - " + fim.format(DIA);
            Acc acc = semanas.computeIfAbsent(rotulo, k -> new Acc());
            for (LocalDate d = cursor; !d.isAfter(fim); d = d.plusDays(1)) {
                Acc dia = porDia.get(d);
                if (dia != null) {
                    acc.merge(dia);
                }
            }
            cursor = fim.plusDays(1);
        }
        List<Ponto> serie = new ArrayList<>();
        for (Map.Entry<String, Acc> e : semanas.entrySet()) {
            Ponto p = new Ponto();
            p.setRotulo(e.getKey());
            p.setValor(usarTicket ? ticket(e.getValue()) : e.getValue().valor);
            p.setDevolucoes(BigDecimal.valueOf(e.getValue().dev));
            serie.add(p);
        }
        return serie;
    }

    private List<Ponto> serieContagem(Map<LocalDate, Acc> porDia) {
        LinkedHashMap<String, Acc> semanas = new LinkedHashMap<>();
        if (porDia.isEmpty()) {
            return List.of();
        }
        LocalDate first = porDia.keySet().iterator().next();
        LocalDate last = first;
        for (LocalDate d : porDia.keySet()) {
            last = d;
        }
        LocalDate cursor = first;
        while (!cursor.isAfter(last)) {
            LocalDate fim = cursor.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            if (fim.isAfter(last)) {
                fim = last;
            }
            String rotulo = cursor.equals(fim) ? cursor.format(DIA) : cursor.format(DIA) + " - " + fim.format(DIA);
            Acc acc = semanas.computeIfAbsent(rotulo, k -> new Acc());
            for (LocalDate d = cursor; !d.isAfter(fim); d = d.plusDays(1)) {
                Acc dia = porDia.get(d);
                if (dia != null) {
                    acc.merge(dia);
                }
            }
            cursor = fim.plusDays(1);
        }
        List<Ponto> serie = new ArrayList<>();
        for (Map.Entry<String, Acc> e : semanas.entrySet()) {
            Ponto p = new Ponto();
            p.setRotulo(e.getKey());
            p.setValor(BigDecimal.valueOf(e.getValue().qtd));
            p.setDevolucoes(BigDecimal.valueOf(e.getValue().dev));
            serie.add(p);
        }
        return serie;
    }

    private List<Grupo> integracoesDe(Map<String, Acc> porOrigem) {
        return porOrigem.entrySet().stream()
                .sorted(Comparator.comparingLong((Map.Entry<String, Acc> e) -> e.getValue().qtd).reversed())
                .map(e -> {
                    Grupo g = new Grupo();
                    g.setNome(e.getKey());
                    g.setPedidos(e.getValue().qtd);
                    g.setValor(e.getValue().valor);
                    return g;
                })
                .toList();
    }

    private List<ProdutoLinha> topProdutos(Map<String, Acc> atual, Map<String, Acc> anterior) {
        return atual.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<String, Acc> e) -> e.getValue().qtdDecimal).reversed()
                        .thenComparing(Map.Entry::getKey, String.CASE_INSENSITIVE_ORDER))
                .limit(8)
                .map(e -> {
                    ProdutoLinha linha = new ProdutoLinha();
                    linha.setNome(e.getKey());
                    linha.setQtd(e.getValue().qtdDecimal.setScale(0, RoundingMode.HALF_UP));
                    BigDecimal ant = anterior.getOrDefault(e.getKey(), new Acc()).qtdDecimal;
                    int cmp = e.getValue().qtdDecimal.compareTo(ant);
                    linha.setTendencia(cmp > 0 ? "UP" : cmp < 0 ? "DOWN" : "FLAT");
                    return linha;
                })
                .toList();
    }

    private List<Ponto> horariosDe(Map<Integer, Acc> porHora) {
        List<Ponto> lista = new ArrayList<>();
        for (int h = 9; h <= 17; h++) {
            Acc acc = porHora.getOrDefault(h, new Acc());
            Ponto p = new Ponto();
            p.setRotulo(String.format("%02d:00", h));
            p.setValor(BigDecimal.valueOf(acc.qtd));
            lista.add(p);
        }
        for (Map.Entry<Integer, Acc> e : porHora.entrySet()) {
            if (e.getKey() < 9 || e.getKey() > 17) {
                Ponto p = new Ponto();
                p.setRotulo(String.format("%02d:00", e.getKey()));
                p.setValor(BigDecimal.valueOf(e.getValue().qtd));
                lista.add(p);
            }
        }
        lista.sort(Comparator.comparing(Ponto::getRotulo));
        return lista;
    }

    private List<EstadoLinha> estadosDe(Map<String, Acc> porUf) {
        return porUf.entrySet().stream()
                .sorted(Comparator.comparingLong((Map.Entry<String, Acc> e) -> e.getValue().qtd).reversed()
                        .thenComparing(Map.Entry::getKey))
                .map(e -> {
                    EstadoLinha linha = new EstadoLinha();
                    linha.setUf(e.getKey());
                    linha.setPedidos(e.getValue().qtd);
                    linha.setValor(e.getValue().valor);
                    return linha;
                })
                .toList();
    }

    private BigDecimal eixoMin(List<Ponto> serie) {
        BigDecimal min = null;
        for (Ponto p : serie) {
            if (min == null || p.getValor().compareTo(min) < 0) {
                min = p.getValor();
            }
        }
        if (min == null) {
            return BigDecimal.ZERO;
        }
        return min.multiply(new BigDecimal("0.7")).setScale(0, RoundingMode.DOWN);
    }

    private BigDecimal eixoMax(List<Ponto> serie, BigDecimal ticket) {
        BigDecimal max = ticket;
        for (Ponto p : serie) {
            if (p.getValor().compareTo(max) > 0) {
                max = p.getValor();
            }
        }
        if (max.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.TEN;
        }
        return max.setScale(0, RoundingMode.UP);
    }

    private String canalDe(PedidoVenda pedido) {
        String origem = texto(pedido.getOrigem());
        return origem.isBlank() ? "Loja" : origem;
    }

    private boolean ecommerce(String canal) {
        String origem = canal.toUpperCase(PT).replace("-", " ").replace("_", " ").trim();
        return ORIGENS_ECOMMERCE.contains(origem);
    }

    private boolean temNota(PedidoVenda pedido) {
        Map<String, Object> extra = extraDe(pedido);
        return !texto(extra.get("notaFiscal"), extra.get("nfe"), extra.get("nf")).isBlank();
    }

    private String ufDe(PedidoVenda pedido, Map<Integer, Cliente> clientes) {
        Map<String, Object> extra = extraDe(pedido);
        String uf = texto(extra.get("uf"), extra.get("estado")).toUpperCase(PT);
        if (uf.length() > 2) {
            uf = uf.substring(0, 2);
        }
        if (!uf.isBlank()) {
            return uf;
        }
        if (pedido.getClienteId() != null) {
            Cliente cliente = clientes.get(pedido.getClienteId());
            if (cliente != null) {
                String estado = texto(cliente.getEstado()).toUpperCase(PT);
                if (estado.length() > 2) {
                    estado = estado.substring(0, 2);
                }
                return estado;
            }
        }
        return "";
    }

    private boolean vendaValida(PedidoVenda pedido) {
        String status = pedido.getStatus() == null ? "" : pedido.getStatus().toUpperCase(PT);
        if (status.contains("CANCEL") || status.contains("RECUS") || status.contains("RASCUNHO")) {
            return false;
        }
        return !status.contains("ORCAMENT") && !status.contains("ORÇAMENT");
    }

    private boolean devolucao(PedidoVenda pedido) {
        String status = pedido.getStatus() == null ? "" : pedido.getStatus().toUpperCase(PT);
        return status.contains("DEVOLU");
    }

    private Map<String, Object> extraDe(PedidoVenda pedido) {
        String bruto = pedido.getDetalhes();
        if (bruto == null || bruto.isBlank() || !bruto.trim().startsWith("{")) {
            return Map.of();
        }
        try {
            return mapper.readValue(bruto, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private List<Map<String, Object>> itensDe(PedidoVenda pedido) {
        String bruto = pedido.getDetalhes();
        if (bruto == null || bruto.isBlank()) {
            return List.of();
        }
        try {
            if (bruto.trim().startsWith("[")) {
                return mapper.readValue(bruto, new TypeReference<List<Map<String, Object>>>() {});
            }
            Map<String, Object> obj = mapper.readValue(bruto, new TypeReference<Map<String, Object>>() {});
            Object itens = obj.get("itens");
            if (itens instanceof List<?>) {
                return mapper.convertValue(itens, new TypeReference<List<Map<String, Object>>>() {});
            }
        } catch (Exception ignored) {
            /* detalhes inválido */
        }
        return List.of();
    }

    private BigDecimal ticket(Acc acc) {
        if (acc.qtd == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return acc.valor.divide(BigDecimal.valueOf(acc.qtd), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal variacao(BigDecimal atual, BigDecimal base) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return atual.subtract(base)
                .multiply(BigDecimal.valueOf(100))
                .divide(base, 2, RoundingMode.HALF_UP);
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

    private BigDecimal n(Object valor) {
        return primeiroPositivo(valor);
    }

    private BigDecimal primeiroPositivo(Object... valores) {
        for (Object valor : valores) {
            if (valor instanceof Number number) {
                return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
            }
            if (valor != null) {
                try {
                    BigDecimal n = new BigDecimal(String.valueOf(valor).replace(",", "."));
                    if (n.compareTo(BigDecimal.ZERO) > 0) {
                        return n.setScale(2, RoundingMode.HALF_UP);
                    }
                } catch (Exception ignored) {
                    /* next */
                }
            }
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private static class Acc {
        private long qtd;
        private long dev;
        private BigDecimal valor = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        private BigDecimal qtdDecimal = BigDecimal.ZERO;

        void add(BigDecimal v) {
            qtd++;
            valor = valor.add(v == null ? BigDecimal.ZERO : v).setScale(2, RoundingMode.HALF_UP);
        }

        void addQtd(BigDecimal q) {
            qtdDecimal = qtdDecimal.add(q == null ? BigDecimal.ZERO : q);
            qtd++;
        }

        void merge(Acc outro) {
            qtd += outro.qtd;
            dev += outro.dev;
            valor = valor.add(outro.valor).setScale(2, RoundingMode.HALF_UP);
            qtdDecimal = qtdDecimal.add(outro.qtdDecimal);
        }
    }
}
