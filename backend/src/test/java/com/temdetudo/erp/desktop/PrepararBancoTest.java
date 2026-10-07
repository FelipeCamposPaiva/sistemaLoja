package com.temdetudo.erp.desktop;

import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PrepararBancoTest {

    @Test
    void procedimentoNaoQuebraNoPontoEVirgulaInterno() throws Exception {
        String sql;
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("db/V20260829__indexes_views.sql")) {
            sql = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        List<String> comandos = PrepararBanco.separar(sql);
        String procedimento = comandos.stream()
                .filter(c -> c.contains("CREATE PROCEDURE erp_create_index_if_missing"))
                .findFirst()
                .orElse("");
        assertTrue(procedimento.contains("END IF;"), procedimento);
        assertFalse(procedimento.contains("DELIMITER"));
        assertTrue(comandos.stream().anyMatch(c -> c.trim().startsWith("CALL erp_add_fk_if_missing")));
    }
}
