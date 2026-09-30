package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.BalancoPatrimonialDTO;
import com.temdetudo.erp.dto.BalancoPatrimonialDTO.BalancoMes;
import com.temdetudo.erp.dto.BalancoPatrimonialDTO.DestinoLucro;
import com.temdetudo.erp.dto.BalancoPatrimonialDTO.Linha;
import com.temdetudo.erp.entity.BemPatrimonial;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.financas.ParcelasConta;
import com.temdetudo.erp.repository.BemPatrimonialRepository;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;
import com.temdetudo.erp.repository.ContaReceberRepository;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BalancoPatrimonialService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");

    private final CaixaRepository caixaRepository;
    private final ContaReceberRepository receberRepository;
    private final ContaPagarRepository pagarRepository;
    private final ProdutoRepository produtoRepository;
    private final EstoqueMovimentacaoRepository movimentacaoRepository;
    private final BemPatrimonialRepository bemRepository;
    private final JurosMultaService jurosMulta;

    public BalancoPatrimonialService(
            CaixaRepository caixaRepository,
            ContaReceberRepository receberRepository,
            ContaPagarRepository pagarRepository,
            ProdutoRepository produtoRepository,
            EstoqueMovimentacaoRepository movimentacaoRepository,
            BemPatrimonialRepository bemRepository,
            JurosMultaService jurosMulta
    ) {
        this.caixaRepository = caixaRepository;
        this.receberRepository = receberRepository;
        this.pagarRepository = pagarRepository;
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.bemRepository = bemRepository;
        this.jurosMulta = jurosMulta;
    }

    public BalancoPatrimonialDTO montar(Integer anoPedido, Integer mesPedido) {
        LocalDate hoje = LocalDate.now();
        int ano = anoPedido == null || anoPedido < 2000 ? hoje.getYear() : anoPedido;
        int mes = mesPedido == null ? hoje.getMonthValue() : Math.min(12, Math.max(1, mesPedido));
        YearMonth alvo = YearMonth.of(ano, mes);

        List<Caixa> caixa = caixaRepository.findAll();
        List<ContaReceber> receber = jurosMulta.listarAtualizadas();
        List<ContaPagar> pagar = pagarRepository.findAll();
        List<Produto> produtos = produtoRepository.findAll();
        List<EstoqueMovimentacao> movimentos = movimentacaoRepository.findAll();
        List<BemPatrimonial> bens = bemRepository.findAll();
        Map<Long, List<EstoqueMovimentacao>> porProduto = agruparMovimentos(movimentos);

        List<BalancoMes> serie = new ArrayList<>();
        BigDecimal dreAcumulado = BigDecimal.ZERO;
        YearMonth cursor = YearMonth.of(ano, 1);
        YearMonth limite = YearMonth.of(ano, 12);
        BalancoMes anterior = fechar(cursor.minusMonths(1), caixa, receber, pagar, produtos, porProduto, bens, BigDecimal.ZERO);
        while (!cursor.isAfter(limite)) {
            BalancoMes atual = fechar(cursor, caixa, receber, pagar, produtos, porProduto, bens, dreAcumulado);
            dreAcumulado = n(atual.getDreAcumulado());
            serie.add(atual);
            cursor = cursor.plusMonths(1);
        }

        BalancoMes competencia = serie.stream()
                .filter((item) -> item.getCompetencia().equals(alvo.toString()))
                .findFirst()
                .orElse(serie.get(Math.min(mes, serie.size()) - 1));
        BalancoMes mesAnterior = serie.stream()
                .filter((item) -> YearMonth.parse(item.getCompetencia()).equals(alvo.minusMonths(1)))
                .findFirst()
                .orElse(anterior);

        BalancoPatrimonialDTO dto = new BalancoPatrimonialDTO();
        dto.setAno(ano);
        dto.setMes(mes);
        dto.setCompetencia(competencia);
        dto.setAnterior(mesAnterior);
        dto.setSerie(serie);
        dto.setAtivo(List.of(
                linha("caixa", "Caixa e equivalentes", "circulante", competencia.getCaixa(), mesAnterior.getCaixa()),
                linha("receber", "Contas a receber", "circulante", competencia.getContasReceber(), mesAnterior.getContasReceber()),
                linha("estoque", "Estoque (custo)", "circulante", competencia.getEstoque(), mesAnterior.getEstoque()),
                linha("imobilizado", "Imobilizado (equipamentos e ferramentas)", "nao-circulante", competencia.getImobilizado(), mesAnterior.getImobilizado())
        ));
        dto.setPassivo(List.of(
                linha("pagar", "Contas a pagar", "circulante", competencia.getContasPagar(), mesAnterior.getContasPagar())
        ));
        dto.setPatrimonio(List.of(
                linha("resultado", "Resultado acumulado (DRE competência)", "pl", competencia.getDreAcumulado(), mesAnterior.getDreAcumulado()),
                linha("ajustes", "Ajustes patrimoniais (estoque, imobilizado e saldo a receber/pagar)", "pl",
                        competencia.getPatrimonioLiquido().subtract(competencia.getDreAcumulado()),
                        mesAnterior.getPatrimonioLiquido().subtract(mesAnterior.getDreAcumulado())),
                linha("pl", "Patrimônio líquido", "pl", competencia.getPatrimonioLiquido(), mesAnterior.getPatrimonioLiquido())
        ));
        dto.setDestino(destino(competencia, mesAnterior));
        return dto;
    }

    private DestinoLucro destino(BalancoMes atual, BalancoMes anterior) {
        DestinoLucro d = new DestinoLucro();
        d.setLucroMes(n(atual.getDreMes()));
        d.setCaixa(delta(atual.getCaixa(), anterior.getCaixa()));
        d.setEstoque(delta(atual.getEstoque(), anterior.getEstoque()));
        d.setImobilizado(delta(atual.getImobilizado(), anterior.getImobilizado()));
        d.setContasReceber(delta(atual.getContasReceber(), anterior.getContasReceber()));
        d.setContasPagar(delta(atual.getContasPagar(), anterior.getContasPagar()));
        List<String> partes = new ArrayList<>();
        if (d.getEstoque().compareTo(BigDecimal.ZERO) > 0) {
            partes.add("estoque");
        }
        if (d.getImobilizado().compareTo(BigDecimal.ZERO) > 0) {
            partes.add("imobilizado");
        }
        if (d.getCaixa().compareTo(BigDecimal.ZERO) > 0) {
            partes.add("caixa");
        }
        if (d.getContasReceber().compareTo(BigDecimal.ZERO) > 0) {
            partes.add("contas a receber");
        }
        if (partes.isEmpty()) {
            d.setResumo("O resultado do mês não aumentou estoque, imobilizado nem caixa. Veja se saiu em pagamento de contas ou redução de saldo.");
        } else {
            d.setResumo("O resultado do mês (DRE por competência, mesmo critério do balancete) aparece principalmente em " + String.join(", ", partes) + ".");
        }
        return d;
    }

    private BalancoMes fechar(
            YearMonth competencia,
            List<Caixa> caixa,
            List<ContaReceber> receber,
            List<ContaPagar> pagar,
            List<Produto> produtos,
            Map<Long, List<EstoqueMovimentacao>> porProduto,
            List<BemPatrimonial> bens,
            BigDecimal dreAnterior
    ) {
        LocalDate fim = competencia.atEndOfMonth();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);
        BalancoMes mes = new BalancoMes();
        mes.setCompetencia(competencia.toString());
        mes.setRotulo(competencia.getMonth().getDisplayName(TextStyle.SHORT, PT) + "/" + competencia.getYear());
        mes.setCaixa(saldoCaixa(caixa, fimDt));
        mes.setContasReceber(saldoReceber(receber, fim));
        mes.setContasPagar(saldoPagar(pagar, fim));
        mes.setEstoque(valorEstoque(produtos, porProduto, fimDt));
        mes.setImobilizado(valorImobilizado(bens, fim));
        BigDecimal ativo = n(mes.getCaixa()).add(n(mes.getContasReceber())).add(n(mes.getEstoque())).add(n(mes.getImobilizado()));
        BigDecimal passivo = n(mes.getContasPagar());
        mes.setAtivo(ativo);
        mes.setPassivo(passivo);
        mes.setPatrimonioLiquido(ativo.subtract(passivo));
        BigDecimal dreMes = dreCompetencia(receber, pagar, competencia.atDay(1), fim);
        mes.setDreMes(dreMes);
        mes.setDreAcumulado(n(dreAnterior).add(dreMes));
        return mes;
    }

    private BigDecimal saldoCaixa(List<Caixa> lista, LocalDateTime fim) {
        BigDecimal total = BigDecimal.ZERO;
        for (Caixa movimento : lista) {
            if (movimento.getDataMovimento() != null && movimento.getDataMovimento().isAfter(fim)) {
                continue;
            }
            BigDecimal valor = n(movimento.getValor());
            if ("SAIDA".equalsIgnoreCase(movimento.getTipo())) {
                total = total.subtract(valor);
            } else {
                total = total.add(valor);
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal dreCompetencia(List<ContaReceber> receber, List<ContaPagar> pagar, LocalDate ini, LocalDate fim) {
        BigDecimal receitas = BigDecimal.ZERO;
        for (ContaReceber conta : receber) {
            String status = statusDe(conta.getStatus());
            if ("AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                continue;
            }
            if (!noPeriodo(conta.getVencimento(), ini, fim)) {
                continue;
            }
            receitas = receitas.add(n(JurosMultaService.totalDe(conta)));
        }
        BigDecimal despesas = BigDecimal.ZERO;
        for (ContaPagar conta : pagar) {
            String status = statusDe(conta.getStatus());
            if ("AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                continue;
            }
            if (!noPeriodo(conta.getVencimento(), ini, fim)) {
                continue;
            }
            despesas = despesas.add(n(conta.getValor()));
        }
        return receitas.subtract(despesas).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean noPeriodo(LocalDate data, LocalDate ini, LocalDate fim) {
        return data != null && !data.isBefore(ini) && !data.isAfter(fim);
    }

    private BigDecimal saldoReceber(List<ContaReceber> lista, LocalDate fim) {
        BigDecimal total = BigDecimal.ZERO;
        for (ContaReceber conta : lista) {
            String status = statusDe(conta.getStatus());
            if ("AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                continue;
            }
            if (conta.getVencimento() != null && conta.getVencimento().isAfter(fim)) {
                continue;
            }
            if (conta.getDataRecebimento() != null && !conta.getDataRecebimento().isAfter(fim)) {
                continue;
            }
            if ("RECEBIDO".equals(status) && conta.getDataRecebimento() == null) {
                continue;
            }
            total = total.add(ParcelasConta.saldo(JurosMultaService.totalDe(conta), conta.getValorPago()));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal saldoPagar(List<ContaPagar> lista, LocalDate fim) {
        BigDecimal total = BigDecimal.ZERO;
        for (ContaPagar conta : lista) {
            String status = statusDe(conta.getStatus());
            if ("AGRUPADO".equals(status) || "CANCELADO".equals(status)) {
                continue;
            }
            if (conta.getVencimento() != null && conta.getVencimento().isAfter(fim)) {
                continue;
            }
            if (conta.getDataPagamento() != null && !conta.getDataPagamento().isAfter(fim)) {
                continue;
            }
            if ("PAGO".equals(status) && conta.getDataPagamento() == null) {
                continue;
            }
            total = total.add(ParcelasConta.saldo(conta.getValor(), conta.getValorPago()));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal valorEstoque(List<Produto> produtos, Map<Long, List<EstoqueMovimentacao>> porProduto, LocalDateTime fim) {
        BigDecimal total = BigDecimal.ZERO;
        boolean mesCorrente = !fim.toLocalDate().isBefore(LocalDate.now().withDayOfMonth(1));
        for (Produto produto : produtos) {
            if (Boolean.FALSE.equals(produto.getAtivo())) {
                continue;
            }
            BigDecimal qtd;
            if (mesCorrente || !porProduto.containsKey(produto.getId())) {
                qtd = n(produto.getEstoque());
            } else {
                qtd = saldoNaData(porProduto.get(produto.getId()), fim, n(produto.getEstoque()));
            }
            if (qtd.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            total = total.add(qtd.multiply(custoDe(produto)));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal saldoNaData(List<EstoqueMovimentacao> movimentos, LocalDateTime fim, BigDecimal atual) {
        EstoqueMovimentacao ultimo = null;
        for (EstoqueMovimentacao movimento : movimentos) {
            if (movimento.getDataMovimento() != null && movimento.getDataMovimento().isAfter(fim)) {
                break;
            }
            ultimo = movimento;
        }
        if (ultimo == null) {
            return atual;
        }
        return n(ultimo.getSaldoPosterior() != null ? ultimo.getSaldoPosterior() : atual);
    }

    private BigDecimal valorImobilizado(List<BemPatrimonial> bens, LocalDate fim) {
        BigDecimal total = BigDecimal.ZERO;
        for (BemPatrimonial bem : bens) {
            if (bem.getDataAquisicao() != null && bem.getDataAquisicao().isAfter(fim)) {
                continue;
            }
            if (bem.getDataBaixa() != null && !bem.getDataBaixa().isAfter(fim)) {
                continue;
            }
            if ("BAIXADO".equalsIgnoreCase(statusDe(bem.getStatus())) && bem.getDataBaixa() == null) {
                continue;
            }
            total = total.add(n(bem.getValorAquisicao()));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private Map<Long, List<EstoqueMovimentacao>> agruparMovimentos(List<EstoqueMovimentacao> movimentos) {
        Map<Long, List<EstoqueMovimentacao>> mapa = new HashMap<>();
        List<EstoqueMovimentacao> ordenados = new ArrayList<>(movimentos);
        ordenados.sort(Comparator
                .comparing(EstoqueMovimentacao::getDataMovimento, Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(EstoqueMovimentacao::getId, Comparator.nullsFirst(Comparator.naturalOrder())));
        for (EstoqueMovimentacao movimento : ordenados) {
            if (movimento.getProdutoId() == null) {
                continue;
            }
            mapa.computeIfAbsent(movimento.getProdutoId(), (k) -> new ArrayList<>()).add(movimento);
        }
        return mapa;
    }

    private BigDecimal custoDe(Produto produto) {
        if (positivo(produto.getCustoMedio())) {
            return produto.getCustoMedio();
        }
        if (positivo(produto.getCusto())) {
            return produto.getCusto();
        }
        return n(produto.getCustoCompra());
    }

    private boolean positivo(BigDecimal valor) {
        return valor != null && valor.compareTo(BigDecimal.ZERO) > 0;
    }

    private Linha linha(String id, String nome, String grupo, BigDecimal valor, BigDecimal anterior) {
        return new Linha(id, nome, grupo, n(valor), n(anterior));
    }

    private BigDecimal delta(BigDecimal atual, BigDecimal anterior) {
        return n(atual).subtract(n(anterior)).setScale(2, RoundingMode.HALF_UP);
    }

    private String statusDe(String status) {
        return status == null ? "" : status.toUpperCase();
    }

    private BigDecimal n(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
