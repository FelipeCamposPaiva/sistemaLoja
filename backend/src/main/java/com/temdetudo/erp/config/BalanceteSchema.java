package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class BalanceteSchema {

    private final DataSource dataSource;

    public BalanceteSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS categorias_financeiras (
                      id INT NOT NULL AUTO_INCREMENT,
                      codigo VARCHAR(20) NOT NULL,
                      nome VARCHAR(120) NOT NULL,
                      tipo VARCHAR(20) NOT NULL,
                      dre_grupo VARCHAR(80) DEFAULT NULL,
                      ordem INT DEFAULT 0,
                      ativo TINYINT(1) DEFAULT 1,
                      PRIMARY KEY (id),
                      UNIQUE KEY uk_cat_fin_codigo (codigo)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
            inserir(stmt, "3.01", "Receita operacional bruta", "RECEITA", "Receitas", 10);
            inserir(stmt, "3.02", "Receita financeira", "RECEITA", "Receitas", 20);
            inserir(stmt, "3.03", "Outras receitas", "RECEITA", "Receitas", 30);
            inserir(stmt, "4.01", "Custo das mercadorias e serviços", "DESPESA", "Custos", 40);
            inserir(stmt, "4.02", "Despesas operacionais", "DESPESA", "Despesas", 50);
            inserir(stmt, "4.03", "Despesas administrativas", "DESPESA", "Despesas", 60);
            inserir(stmt, "4.04", "Despesas financeiras", "DESPESA", "Despesas", 70);
            inserir(stmt, "4.05", "Impostos e taxas", "DESPESA", "Despesas", 80);
            adicionar(conexao, stmt, "contas_pagar", "categoria",
                    "ALTER TABLE contas_pagar ADD COLUMN categoria VARCHAR(80) NULL");
            adicionar(conexao, stmt, "contas_receber", "categoria",
                    "ALTER TABLE contas_receber ADD COLUMN categoria VARCHAR(80) NULL");
            adicionar(conexao, stmt, "caixa", "categoria",
                    "ALTER TABLE caixa ADD COLUMN categoria VARCHAR(80) NULL");
        } catch (Exception ignored) {
            /* schema legado */
        }
    }

    private void inserir(Statement stmt, String codigo, String nome, String tipo, String dre, int ordem) throws Exception {
        stmt.execute("INSERT IGNORE INTO categorias_financeiras (codigo, nome, tipo, dre_grupo, ordem, ativo) VALUES ('"
                + codigo + "', '" + nome + "', '" + tipo + "', '" + dre + "', " + ordem + ", 1)");
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
