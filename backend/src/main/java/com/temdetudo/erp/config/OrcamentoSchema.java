package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class OrcamentoSchema {

    private final DataSource dataSource;

    public OrcamentoSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS orcamentos (
                      id INT NOT NULL AUTO_INCREMENT,
                      numero VARCHAR(20) DEFAULT NULL,
                      cliente_id INT DEFAULT NULL,
                      cliente_nome VARCHAR(255) DEFAULT NULL,
                      nome_fantasia VARCHAR(255) DEFAULT NULL,
                      valor DECIMAL(10,2) DEFAULT NULL,
                      observacoes TEXT,
                      status VARCHAR(30) DEFAULT NULL,
                      data_orcamento DATETIME DEFAULT NULL,
                      vendedor VARCHAR(180) DEFAULT NULL,
                      email_enviado TINYINT(1) DEFAULT 0,
                      PRIMARY KEY (id),
                      KEY cliente_id (cliente_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            adicionar(conexao, stmt, "cliente_nome", "ALTER TABLE orcamentos ADD COLUMN cliente_nome VARCHAR(255) DEFAULT NULL");
            adicionar(conexao, stmt, "nome_fantasia", "ALTER TABLE orcamentos ADD COLUMN nome_fantasia VARCHAR(255) DEFAULT NULL");
            adicionar(conexao, stmt, "vendedor", "ALTER TABLE orcamentos ADD COLUMN vendedor VARCHAR(180) DEFAULT NULL");
            adicionar(conexao, stmt, "email_enviado", "ALTER TABLE orcamentos ADD COLUMN email_enviado TINYINT(1) DEFAULT 0");
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível alinhar a tabela de orçamentos.", ex);
        }
    }

    private void adicionar(Connection conexao, Statement stmt, String coluna, String ddl) throws Exception {
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?"
        )) {
            ps.setString(1, "orcamentos");
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
