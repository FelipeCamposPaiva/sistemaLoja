package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class ContasParcelarSchema {

    private final DataSource dataSource;

    public ContasParcelarSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            for (String tabela : new String[] { "contas_receber", "contas_pagar" }) {
                adicionar(conexao, stmt, tabela, "valor_pago",
                        "ALTER TABLE " + tabela + " ADD COLUMN valor_pago DECIMAL(10,2) DEFAULT 0");
                adicionar(conexao, stmt, tabela, "valor_original",
                        "ALTER TABLE " + tabela + " ADD COLUMN valor_original DECIMAL(10,2) DEFAULT NULL");
                adicionar(conexao, stmt, tabela, "grupo_id",
                        "ALTER TABLE " + tabela + " ADD COLUMN grupo_id BIGINT DEFAULT NULL");
                adicionar(conexao, stmt, tabela, "parcela",
                        "ALTER TABLE " + tabela + " ADD COLUMN parcela INT DEFAULT NULL");
                adicionar(conexao, stmt, tabela, "parcelas",
                        "ALTER TABLE " + tabela + " ADD COLUMN parcelas INT DEFAULT NULL");
                adicionar(conexao, stmt, tabela, "juros_pct",
                        "ALTER TABLE " + tabela + " ADD COLUMN juros_pct DECIMAL(8,4) DEFAULT NULL");
                adicionar(conexao, stmt, tabela, "origem_ids",
                        "ALTER TABLE " + tabela + " ADD COLUMN origem_ids VARCHAR(500) DEFAULT NULL");
            }
            stmt.execute("UPDATE contas_receber SET valor_pago = 0 WHERE valor_pago IS NULL");
            stmt.execute("UPDATE contas_pagar SET valor_pago = 0 WHERE valor_pago IS NULL");
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
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
