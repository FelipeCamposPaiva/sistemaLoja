package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class PrecoPromocionalSchema {

    private final DataSource dataSource;

    public PrecoPromocionalSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            adicionar(conexao, stmt, "produtos", "preco_promocional",
                    "ALTER TABLE produtos ADD COLUMN preco_promocional DECIMAL(15,2) DEFAULT NULL");
            adicionar(conexao, stmt, "produtos", "desconto_percentual",
                    "ALTER TABLE produtos ADD COLUMN desconto_percentual DECIMAL(7,2) DEFAULT NULL");
        } catch (Exception ignored) {
            /* tabela pode não existir ainda */
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
