package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class ProducaoSchema {

    private final DataSource dataSource;

    public ProducaoSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            adicionar(conexao, stmt, "producao", "supervisor",
                    "ALTER TABLE producao ADD COLUMN supervisor VARCHAR(150) DEFAULT NULL");
            adicionar(conexao, stmt, "producao", "hora",
                    "ALTER TABLE producao ADD COLUMN hora VARCHAR(5) DEFAULT NULL");
            adicionar(conexao, stmt, "producao", "agenda_evento_id",
                    "ALTER TABLE producao ADD COLUMN agenda_evento_id BIGINT DEFAULT NULL");
            adicionar(conexao, stmt, "producao", "numero",
                    "ALTER TABLE producao ADD COLUMN numero INT DEFAULT NULL");
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
