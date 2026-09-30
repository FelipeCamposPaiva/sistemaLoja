package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class BensPatrimoniaisSchema {

    private final DataSource dataSource;

    public BensPatrimoniaisSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS bens_patrimoniais (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      tipo VARCHAR(40) DEFAULT NULL,
                      nome VARCHAR(255) DEFAULT NULL,
                      descricao TEXT,
                      valor_aquisicao DECIMAL(12,2) DEFAULT 0,
                      data_aquisicao DATE DEFAULT NULL,
                      data_baixa DATE DEFAULT NULL,
                      status VARCHAR(30) DEFAULT 'ATIVO',
                      localizacao VARCHAR(255) DEFAULT NULL,
                      observacao TEXT,
                      PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
        }
    }
}
