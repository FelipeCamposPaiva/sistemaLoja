package com.temdetudo.erp.financas;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class ParcelasConta {

    private ParcelasConta() {
    }

    public static BigDecimal nuloZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    public static BigDecimal saldo(BigDecimal valor, BigDecimal pago) {
        BigDecimal resto = nuloZero(valor).subtract(nuloZero(pago));
        return resto.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : resto.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal comJuros(BigDecimal total, BigDecimal jurosPct) {
        BigDecimal base = nuloZero(total);
        BigDecimal pct = nuloZero(jurosPct);
        if (pct.compareTo(BigDecimal.ZERO) <= 0) {
            return base.setScale(2, RoundingMode.HALF_UP);
        }
        return base.multiply(BigDecimal.ONE.add(pct.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static List<BigDecimal> valores(BigDecimal total, int parcelas) {
        int n = Math.max(1, parcelas);
        BigDecimal cents = nuloZero(total).movePointRight(2).setScale(0, RoundingMode.HALF_UP);
        long totalCents = cents.longValue();
        long base = totalCents / n;
        List<BigDecimal> lista = new ArrayList<>();
        long acumulado = 0;
        for (int i = 0; i < n; i++) {
            long fatia = i == n - 1 ? totalCents - acumulado : base;
            acumulado += fatia;
            lista.add(BigDecimal.valueOf(fatia).movePointLeft(2).setScale(2, RoundingMode.UNNECESSARY));
        }
        return lista;
    }

    public static LocalDate vencimento(LocalDate primeiro, int indice, int intervaloDias) {
        LocalDate inicio = primeiro == null ? LocalDate.now() : primeiro;
        int dias = intervaloDias == 0 ? 30 : Math.abs(intervaloDias);
        return inicio.plusDays((long) indice * dias);
    }
}
