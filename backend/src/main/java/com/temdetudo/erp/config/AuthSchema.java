package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class AuthSchema {

    private final DataSource dataSource;

    public AuthSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            coluna(stmt, "dois_fatores TINYINT(1) NOT NULL DEFAULT 0");
            coluna(stmt, "codigo_2fa VARCHAR(12) NULL");
            coluna(stmt, "codigo_2fa_expira DATETIME NULL");
            coluna(stmt, "recuperacao_token VARCHAR(64) NULL");
            coluna(stmt, "recuperacao_expira DATETIME NULL");
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
        }
    }

    private void coluna(Statement stmt, String definicao) {
        try {
            stmt.execute("ALTER TABLE usuarios ADD COLUMN " + definicao);
        } catch (Exception ignored) {
            /* coluna já existe */
        }
    }
}
