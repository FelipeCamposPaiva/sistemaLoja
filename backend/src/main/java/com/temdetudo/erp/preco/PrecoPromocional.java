package com.temdetudo.erp.preco;

import com.temdetudo.erp.entity.Produto;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PrecoPromocional {

    private static final int CASAS = 2;
    private static final RoundingMode ARRED = RoundingMode.HALF_UP;
    private static final BigDecimal CEM = new BigDecimal("100");

    private PrecoPromocional() {
    }

    public static void alinhar(Produto produto) {
        if (produto == null) {
            return;
        }
        BigDecimal preco = n(produto.getPreco());
        BigDecimal promo = n(produto.getPrecoPromocional());
        BigDecimal pct = n(produto.getDescontoPercentual());
        if (preco.compareTo(BigDecimal.ZERO) <= 0) {
            produto.setPrecoPromocional(null);
            produto.setDescontoPercentual(null);
            return;
        }
        if (pct.compareTo(BigDecimal.ZERO) > 0) {
            pct = pct.min(CEM).max(BigDecimal.ZERO).setScale(CASAS, ARRED);
            promo = preco.multiply(BigDecimal.ONE.subtract(pct.divide(CEM, 8, ARRED))).setScale(CASAS, ARRED);
        } else if (promo.compareTo(BigDecimal.ZERO) > 0 && promo.compareTo(preco) < 0) {
            pct = BigDecimal.ONE.subtract(promo.divide(preco, 8, ARRED)).multiply(CEM).setScale(CASAS, ARRED);
            promo = promo.setScale(CASAS, ARRED);
        } else {
            produto.setPrecoPromocional(null);
            produto.setDescontoPercentual(null);
            return;
        }
        if (promo.compareTo(BigDecimal.ZERO) <= 0 || promo.compareTo(preco) >= 0) {
            produto.setPrecoPromocional(null);
            produto.setDescontoPercentual(null);
            return;
        }
        produto.setPrecoPromocional(promo);
        produto.setDescontoPercentual(pct);
    }

    public static void reajustar(Produto produto, BigDecimal percentual) {
        reajustar(produto, percentual, true, true);
    }

    public static void reajustar(Produto produto, BigDecimal percentual, boolean venda, boolean atacado) {
        if (produto == null || percentual == null) {
            return;
        }
        BigDecimal fator = BigDecimal.ONE.add(percentual.divide(CEM, 8, ARRED));
        if (venda) {
            produto.setPreco(n(produto.getPreco()).multiply(fator).setScale(CASAS, ARRED));
        }
        if (atacado) {
            BigDecimal atual = n(produto.getPrecoAtacado());
            if (atual.compareTo(BigDecimal.ZERO) > 0) {
                produto.setPrecoAtacado(atual.multiply(fator).setScale(CASAS, ARRED));
            }
        }
        alinhar(produto);
    }

    public static boolean emPromocao(Produto produto) {
        BigDecimal preco = n(produto == null ? null : produto.getPreco());
        BigDecimal promo = n(produto == null ? null : produto.getPrecoPromocional());
        return promo.compareTo(BigDecimal.ZERO) > 0 && promo.compareTo(preco) < 0;
    }

    private static BigDecimal n(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
