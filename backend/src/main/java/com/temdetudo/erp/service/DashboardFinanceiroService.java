package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.DashboardFinanceiroDTO;
import com.temdetudo.erp.dto.DashboardFinanceiroDTO.Aging;
import com.temdetudo.erp.dto.DashboardFinanceiroDTO.ContaBarra;
import com.temdetudo.erp.dto.DashboardFinanceiroDTO.Ponto;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DashboardFinanceiroService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");

    private final CaixaRepository caixaRepository;
    private final ContaPagarRepository pagarRepository;
    private final JurosMultaService jurosMulta;

    public DashboardFinanceiroService(
            CaixaRepository caixaRepository,
            ContaPagarRepository pagarRepository,
            JurosMultaService jurosMulta
    ) {
        this.caixaRepository = caixaRepository;
        this.pagarRepository = pagarRepository;
        this.jurosMulta = jurosMulta;
    }

    public DashboardFinanceiroDTO montar() {
        LocalDate hoje = LocalDate.now();
        List<Caixa> movimentos = caixaRepository.findAll();
        BigDecimal entradas = BigDecimal.ZERO;
        BigDecimal saidas = BigDecimal.ZERO;
        Map<String, BigDecimal> porConta = new LinkedHashMap<>();
        for (Caixa mov : movimentos) {
            BigDecimal valor = n(mov.getValor());
            String tipo = mov.getTipo() == null ? "" : mov.getTipo().toUpperCase(PT);
            String nome = texto(mov.getCategoria(), mov.getOrigem(), "Caixa");
            BigDecimal atual = porConta.getOrDefault(nome, BigDecimal.ZERO);
            if ("ENTRADA".equals(tipo)) {
                entradas = entradas.add(valor);
                porConta.put(nome, atual.add(valor));
            } else if ("SAIDA".equals(tipo) || "SAÍDA".equals(tipo)) {
                saidas = saidas.add(valor);
                porConta.put(nome, atual.subtract(valor));
            }
        }
        BigDecimal saldo = entradas.subtract(saidas);

        List<ContaReceber> receberLista = jurosMulta.listarAtualizadas();
        List<ContaPagar> pagarLista = pagarRepository.findAll();
        BigDecimal receber = BigDecimal.ZERO;
        BigDecimal pagar = BigDecimal.ZERO;
        long vencendoHoje = 0;
        BigDecimal receber30 = BigDecimal.ZERO;
        BigDecimal pagar30 = BigDecimal.ZERO;
        BigDecimal receber60 = BigDecimal.ZERO;
        BigDecimal pagar60 = BigDecimal.ZERO;
        BigDecimal receber90 = BigDecimal.ZERO;
        BigDecimal pagar90 = BigDecimal.ZERO;

        Map<String, Aging> faixas = faixas();
        for (ContaReceber conta : receberLista) {
            if (!abertaReceber(conta)) {
                continue;
            }
            BigDecimal valor = JurosMultaService.totalDe(conta);
            receber = receber.add(valor);
            if (hoje.equals(conta.getVencimento())) {
                vencendoHoje++;
            }
            somarAging(faixas, conta.getVencimento(), hoje, valor, true);
            if (conta.getVencimento() != null) {
                long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, conta.getVencimento());
                if (dias >= 0 && dias <= 30) {
                    receber30 = receber30.add(valor);
                }
                if (dias >= 0 && dias <= 60) {
                    receber60 = receber60.add(valor);
                }
                if (dias >= 0 && dias <= 90) {
                    receber90 = receber90.add(valor);
                }
            }
        }
        for (ContaPagar conta : pagarLista) {
            if (!abertaPagar(conta)) {
                continue;
            }
            BigDecimal valor = n(conta.getValor());
            pagar = pagar.add(valor);
            if (hoje.equals(conta.getVencimento())) {
                vencendoHoje++;
            }
            somarAging(faixas, conta.getVencimento(), hoje, valor, false);
            if (conta.getVencimento() != null) {
                long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, conta.getVencimento());
                if (dias >= 0 && dias <= 30) {
                    pagar30 = pagar30.add(valor);
                }
                if (dias >= 0 && dias <= 60) {
                    pagar60 = pagar60.add(valor);
                }
                if (dias >= 0 && dias <= 90) {
                    pagar90 = pagar90.add(valor);
                }
            }
        }

        List<ContaBarra> barras = porConta.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<String, BigDecimal> e) -> e.getValue().abs()).reversed())
                .map(e -> {
                    ContaBarra b = new ContaBarra();
                    b.setNome(e.getKey());
                    b.setSaldo(e.getValue().setScale(2, RoundingMode.HALF_UP));
                    return b;
                })
                .toList();

        DashboardFinanceiroDTO dto = new DashboardFinanceiroDTO();
        dto.setAtualizadoEm(LocalDateTime.now().toString());
        dto.setSaldoCaixa(saldo.setScale(2, RoundingMode.HALF_UP));
        dto.setEntradasMes(entradas.setScale(2, RoundingMode.HALF_UP));
        dto.setSaidasMes(saidas.setScale(2, RoundingMode.HALF_UP));
        dto.setContasReceber(receber.setScale(2, RoundingMode.HALF_UP));
        dto.setContasPagar(pagar.setScale(2, RoundingMode.HALF_UP));
        dto.setResultado(saldo.add(receber).subtract(pagar).setScale(2, RoundingMode.HALF_UP));
        dto.setContasVencendoHoje(vencendoHoje);
        dto.setContas(barras);
        dto.setCaixaMaior(barras.isEmpty() ? "Caixa" : barras.get(0).getNome());
        dto.setFluxo(List.of(
                ponto("Saldo atual", saldo),
                ponto("30 dias", saldo.add(receber30).subtract(pagar30)),
                ponto("60 dias", saldo.add(receber60).subtract(pagar60)),
                ponto("90 dias", saldo.add(receber90).subtract(pagar90))
        ));
        dto.setAging(new ArrayList<>(faixas.values()));
        return dto;
    }

    private Map<String, Aging> faixas() {
        String[] nomes = {
                "+30 dias atrás", "30 dias atrás", "15 dias atrás", "7 dias atrás",
                "Hoje", "7 dias", "15 dias", "30 dias", "+30 dias"
        };
        Map<String, Aging> mapa = new LinkedHashMap<>();
        for (String nome : nomes) {
            Aging a = new Aging();
            a.setRotulo(nome);
            mapa.put(nome, a);
        }
        return mapa;
    }

    private void somarAging(Map<String, Aging> faixas, LocalDate vencimento, LocalDate hoje, BigDecimal valor, boolean receber) {
        String chave = faixaDe(vencimento, hoje);
        Aging a = faixas.get(chave);
        if (a == null) {
            return;
        }
        if (receber) {
            a.setReceber(a.getReceber().add(valor));
        } else {
            a.setPagar(a.getPagar().add(valor));
        }
    }

    private String faixaDe(LocalDate vencimento, LocalDate hoje) {
        if (vencimento == null) {
            return "Hoje";
        }
        long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, vencimento);
        if (dias <= -31) {
            return "+30 dias atrás";
        }
        if (dias <= -16) {
            return "30 dias atrás";
        }
        if (dias <= -8) {
            return "15 dias atrás";
        }
        if (dias <= -1) {
            return "7 dias atrás";
        }
        if (dias == 0) {
            return "Hoje";
        }
        if (dias <= 7) {
            return "7 dias";
        }
        if (dias <= 15) {
            return "15 dias";
        }
        if (dias <= 30) {
            return "30 dias";
        }
        return "+30 dias";
    }

    private Ponto ponto(String rotulo, BigDecimal valor) {
        Ponto p = new Ponto();
        p.setRotulo(rotulo);
        p.setValor(valor.setScale(2, RoundingMode.HALF_UP));
        return p;
    }

    private boolean abertaReceber(ContaReceber conta) {
        String status = conta.getStatus() == null ? "" : conta.getStatus().toUpperCase(PT);
        return !status.equals("RECEBIDO") && !status.equals("CANCELADO") && !status.equals("AGRUPADO") && !status.equals("CREDITO");
    }

    private boolean abertaPagar(ContaPagar conta) {
        String status = conta.getStatus() == null ? "" : conta.getStatus().toUpperCase(PT);
        return !status.equals("PAGO") && !status.equals("CANCELADO") && !status.equals("AGRUPADO");
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

    private BigDecimal n(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
