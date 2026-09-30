package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.BalanceteDTO;
import com.temdetudo.erp.dto.BalanceteDTO.Dre;
import com.temdetudo.erp.dto.BalanceteDTO.Linha;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.CategoriaFinanceira;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.CategoriaFinanceiraRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;
import com.temdetudo.erp.repository.ContaReceberRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BalanceteService {

    private final CategoriaFinanceiraRepository categorias;
    private final ContaReceberRepository receber;
    private final ContaPagarRepository pagar;
    private final CaixaRepository caixa;

    public BalanceteService(
            CategoriaFinanceiraRepository categorias,
            ContaReceberRepository receber,
            ContaPagarRepository pagar,
            CaixaRepository caixa
    ) {
        this.categorias = categorias;
        this.receber = receber;
        this.pagar = pagar;
        this.caixa = caixa;
    }

    public BalanceteDTO montar(int ano, int mes, String regimePedido) {
        YearMonth competencia = YearMonth.of(ano, mes);
        LocalDate ini = competencia.atDay(1);
        LocalDate fim = competencia.atEndOfMonth();
        boolean regimeCaixa = "caixa".equalsIgnoreCase(regimePedido);

        List<CategoriaFinanceira> plano = categorias.findAllByOrderByOrdemAscCodigoAsc();
        Map<String, Linha> mapa = new LinkedHashMap<>();
        for (CategoriaFinanceira cat : plano) {
            mapa.put(cat.getCodigo(), linhaDe(cat));
        }

        int lancamentos = 0;
        if (regimeCaixa) {
            for (Caixa mov : caixa.findAll()) {
                LocalDate data = mov.getDataMovimento() == null ? null : mov.getDataMovimento().toLocalDate();
                if (!noMes(data, ini, fim) || n(mov.getValor()).signum() <= 0) {
                    continue;
                }
                boolean saida = "SAIDA".equalsIgnoreCase(String.valueOf(mov.getTipo()));
                String tipo = saida ? "DESPESA" : "RECEITA";
                String chave = categoriaDe(mov.getCategoria(), mov.getDescricao(), tipo, plano);
                somar(mapa, plano, chave, tipo, n(mov.getValor()));
                lancamentos++;
            }
        } else {
            for (ContaReceber conta : receber.findAll()) {
                if (ignorar(conta.getStatus())) {
                    continue;
                }
                if (!noMes(conta.getVencimento(), ini, fim)) {
                    continue;
                }
                BigDecimal valor = n(conta.getValorAtualizado() != null ? conta.getValorAtualizado() : conta.getValor());
                if (valor.signum() <= 0) {
                    continue;
                }
                String chave = categoriaDe(conta.getCategoria(), conta.getDescricao(), "RECEITA", plano);
                somar(mapa, plano, chave, "RECEITA", valor);
                lancamentos++;
            }
            for (ContaPagar conta : pagar.findAll()) {
                if (ignorar(conta.getStatus())) {
                    continue;
                }
                if (!noMes(conta.getVencimento(), ini, fim)) {
                    continue;
                }
                BigDecimal valor = n(conta.getValor());
                if (valor.signum() <= 0) {
                    continue;
                }
                String chave = categoriaDe(conta.getCategoria(), conta.getObservacao(), "DESPESA", plano);
                somar(mapa, plano, chave, "DESPESA", valor);
                lancamentos++;
            }
        }

        List<Linha> receitas = new ArrayList<>();
        List<Linha> despesas = new ArrayList<>();
        BigDecimal debito = BigDecimal.ZERO;
        BigDecimal credito = BigDecimal.ZERO;
        Map<String, BigDecimal> dreMapa = new LinkedHashMap<>();
        for (Linha linha : mapa.values()) {
            fechar(linha);
            if (linha.getLancamentos() == 0 && linha.getDebito().signum() == 0 && linha.getCredito().signum() == 0) {
                continue;
            }
            debito = debito.add(linha.getDebito());
            credito = credito.add(linha.getCredito());
            String grupo = linha.getDreGrupo() == null ? linha.getTipo() : linha.getDreGrupo();
            BigDecimal atual = dreMapa.getOrDefault(grupo, BigDecimal.ZERO);
            BigDecimal delta = "RECEITA".equals(linha.getTipo()) ? linha.getCredito() : linha.getDebito().negate();
            dreMapa.put(grupo, atual.add(delta));
            if ("RECEITA".equals(linha.getTipo())) {
                receitas.add(linha);
            } else {
                despesas.add(linha);
            }
        }

        BalanceteDTO dto = new BalanceteDTO();
        dto.setAno(ano);
        dto.setMes(mes);
        dto.setRegime(regimeCaixa ? "caixa" : "competencia");
        dto.setCompetencia(competencia.format(DateTimeFormatter.ofPattern("MMMM/yyyy", Locale.forLanguageTag("pt-BR"))));
        dto.setReceitas(receitas);
        dto.setDespesas(despesas);
        dto.setTotalDebito(debito);
        dto.setTotalCredito(credito);
        dto.setResultado(credito.subtract(debito));
        dto.setLancamentos(lancamentos);
        List<Dre> dre = new ArrayList<>();
        dreMapa.forEach((grupo, valor) -> dre.add(new Dre(grupo, valor)));
        dre.add(new Dre("Resultado do período", dto.getResultado()));
        dto.setDre(dre);
        return dto;
    }

    private static Linha linhaDe(CategoriaFinanceira cat) {
        Linha linha = new Linha();
        linha.setCodigo(cat.getCodigo());
        linha.setNome(cat.getNome());
        linha.setTipo(cat.getTipo());
        linha.setDreGrupo(cat.getDreGrupo());
        return linha;
    }

    private static void somar(Map<String, Linha> mapa, List<CategoriaFinanceira> plano, String codigo, String tipo, BigDecimal valor) {
        Linha linha = mapa.get(codigo);
        if (linha == null) {
            linha = new Linha();
            linha.setCodigo(codigo);
            CategoriaFinanceira cat = plano.stream().filter(c -> codigo.equals(c.getCodigo())).findFirst().orElse(null);
            linha.setNome(cat != null ? cat.getNome() : codigo);
            linha.setTipo(tipo);
            linha.setDreGrupo(cat != null ? cat.getDreGrupo() : tipo);
            mapa.put(codigo, linha);
        }
        if ("RECEITA".equals(tipo)) {
            linha.setCredito(n(linha.getCredito()).add(valor));
        } else {
            linha.setDebito(n(linha.getDebito()).add(valor));
        }
        linha.setLancamentos(linha.getLancamentos() + 1);
    }

    private static void fechar(Linha linha) {
        BigDecimal saldo = n(linha.getCredito()).subtract(n(linha.getDebito()));
        linha.setSaldo(saldo);
    }

    static String categoriaDe(String informada, String texto, String tipo, List<CategoriaFinanceira> plano) {
        String chave = String.valueOf(informada == null ? "" : informada).trim();
        if (!chave.isEmpty()) {
            for (CategoriaFinanceira cat : plano) {
                if (chave.equalsIgnoreCase(cat.getCodigo()) || chave.equalsIgnoreCase(cat.getNome())) {
                    return cat.getCodigo();
                }
            }
        }
        String n = String.valueOf(texto == null ? "" : texto).toLowerCase(Locale.ROOT);
        if ("RECEITA".equals(tipo)) {
            if (n.contains("juro") || n.contains("rendimento") || n.contains("aplic")) {
                return "3.02";
            }
            if (n.contains("venda") || n.contains("pedido") || n.contains("pdv") || n.contains("os ") || n.contains("serviço") || n.contains("servico")) {
                return "3.01";
            }
            return "3.01";
        }
        if (n.contains("juro") || n.contains("multa") || n.contains("tarifa banc")) {
            return "4.04";
        }
        if (n.contains("imposto") || n.contains("iss") || n.contains("icms") || n.contains("das") || n.contains("simples")) {
            return "4.05";
        }
        if (n.contains("aluguel") || n.contains("energia") || n.contains("salár") || n.contains("salar") || n.contains("água") || n.contains("agua") || n.contains("internet")) {
            return "4.03";
        }
        if (n.contains("compra") || n.contains("fornecedor") || n.contains(" mercad") || n.contains("insumo") || n.contains("nota")) {
            return "4.01";
        }
        return "4.02";
    }

    private static boolean ignorar(String status) {
        String s = String.valueOf(status == null ? "" : status).toUpperCase(Locale.ROOT);
        return "CANCELADO".equals(s) || "AGRUPADO".equals(s);
    }

    private static boolean noMes(LocalDate data, LocalDate ini, LocalDate fim) {
        return data != null && !data.isBefore(ini) && !data.isAfter(fim);
    }

    private static BigDecimal n(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
