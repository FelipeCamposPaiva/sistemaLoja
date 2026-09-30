package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class LocaisEstoqueSchema {

    private final DataSource dataSource;

    public LocaisEstoqueSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS locais (
                      id INT NOT NULL AUTO_INCREMENT,
                      nome VARCHAR(100) NOT NULL,
                      sigla VARCHAR(10) NOT NULL,
                      tipo ENUM('LOJA','DEPOSITO','PRODUCAO') NOT NULL,
                      ativo TINYINT DEFAULT 1,
                      PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS estoque (
                      id INT NOT NULL AUTO_INCREMENT,
                      produto_id INT NOT NULL,
                      local_id INT NOT NULL,
                      quantidade DECIMAL(10,2) DEFAULT 0.00,
                      PRIMARY KEY (id),
                      KEY produto_id (produto_id),
                      KEY local_id (local_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
            try {
                stmt.execute("ALTER TABLE estoque ADD UNIQUE KEY uk_estoque_produto_local (produto_id, local_id)");
            } catch (Exception ignored) {
                /* índice já existe */
            }
            inserir(stmt, "Água Limpa", "AL", "LOJA");
            inserir(stmt, "Santo Agostinho", "STG", "LOJA");
            inserir(stmt, "Estoque", "EST", "DEPOSITO");
            inserir(stmt, "Depósito", "DEP", "DEPOSITO");
            inserir(stmt, "Em transferência", "TRANS", "DEPOSITO");
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
        }
    }

    private void inserir(Statement stmt, String nome, String sigla, String tipo) {
        try {
            stmt.execute("INSERT INTO locais (nome, sigla, tipo, ativo) "
                    + "SELECT '" + nome.replace("'", "''") + "', '" + sigla + "', '" + tipo + "', 1 "
                    + "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM locais WHERE sigla = '" + sigla + "')");
        } catch (Exception ignored) {
            /* seed já aplicado */
        }
    }
}
