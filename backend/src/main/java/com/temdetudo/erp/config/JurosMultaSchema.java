package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class JurosMultaSchema {

    private final DataSource dataSource;

    public JurosMultaSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS financeiro_parametros (
                      id INT NOT NULL,
                      multa_percentual DECIMAL(7,4) NOT NULL DEFAULT 2.0000,
                      juros_mes_percentual DECIMAL(7,4) NOT NULL DEFAULT 1.0000,
                      carencia_dias INT NOT NULL DEFAULT 0,
                      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                      PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
            stmt.execute("""
                    INSERT IGNORE INTO financeiro_parametros (id, multa_percentual, juros_mes_percentual, carencia_dias)
                    VALUES (1, 2.0000, 1.0000, 0)
                    """);
            adicionar(conexao, stmt, "contas_receber", "juros",
                    "ALTER TABLE contas_receber ADD COLUMN juros DECIMAL(10,2) DEFAULT 0.00");
            adicionar(conexao, stmt, "contas_receber", "multa",
                    "ALTER TABLE contas_receber ADD COLUMN multa DECIMAL(10,2) DEFAULT 0.00");
            adicionar(conexao, stmt, "contas_receber", "valor_atualizado",
                    "ALTER TABLE contas_receber ADD COLUMN valor_atualizado DECIMAL(10,2) DEFAULT NULL");
            adicionar(conexao, stmt, "contas_receber", "dias_atraso",
                    "ALTER TABLE contas_receber ADD COLUMN dias_atraso INT DEFAULT 0");
        } catch (Exception ignored) {
            /* schema legado */
        }
    }

    private void adicionar(Connection conexao, Statement stmt, String tabela, String coluna, String ddl) throws Exception {
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?"
        )) {
            ps.setString(1, tabela);
            ps.setString(2, coluna);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return;
                }
            }
        }
        stmt.execute(ddl);
    }
}
