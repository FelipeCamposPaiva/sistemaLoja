package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class EstoqueAuditoriaSchema {

    private final DataSource dataSource;

    public EstoqueAuditoriaSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("ALTER TABLE estoque_movimentacao MODIFY COLUMN tipo VARCHAR(30) DEFAULT NULL");
            stmt.execute("ALTER TABLE estoque_movimentacao MODIFY COLUMN quantidade DECIMAL(14,4) DEFAULT NULL");
            adicionar(conexao, stmt, "usuario_nome",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN usuario_nome VARCHAR(150) DEFAULT NULL AFTER usuario_id");
            adicionar(conexao, stmt, "origem",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN origem VARCHAR(30) DEFAULT 'MANUAL' AFTER data_movimento");
            adicionar(conexao, stmt, "origem_id",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN origem_id BIGINT DEFAULT NULL AFTER origem");
            adicionar(conexao, stmt, "origem_ref",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN origem_ref VARCHAR(150) DEFAULT NULL AFTER origem_id");
            adicionar(conexao, stmt, "saldo_anterior",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN saldo_anterior DECIMAL(14,4) DEFAULT NULL AFTER origem_ref");
            adicionar(conexao, stmt, "saldo_posterior",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN saldo_posterior DECIMAL(14,4) DEFAULT NULL AFTER saldo_anterior");
            adicionar(conexao, stmt, "status",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN status VARCHAR(20) DEFAULT 'ATIVO' AFTER saldo_posterior");
            adicionar(conexao, stmt, "movimento_origem_id",
                    "ALTER TABLE estoque_movimentacao ADD COLUMN movimento_origem_id INT DEFAULT NULL AFTER status");
            stmt.execute("UPDATE estoque_movimentacao SET status = 'ATIVO' WHERE status IS NULL OR status = ''");
            stmt.execute("UPDATE estoque_movimentacao SET origem = 'MANUAL' WHERE origem IS NULL OR origem = ''");
            stmt.execute("""
                    UPDATE estoque_movimentacao m
                    LEFT JOIN usuarios u ON u.id = m.usuario_id
                    SET m.usuario_nome = u.nome
                    WHERE (m.usuario_nome IS NULL OR m.usuario_nome = '')
                      AND u.nome IS NOT NULL
                    """);
            stmt.execute("""
                    CREATE OR REPLACE VIEW vw_estoque_auditoria AS
                    SELECT
                      m.id,
                      m.data_movimento,
                      m.usuario_id,
                      COALESCE(m.usuario_nome, u.nome, u.usuario, u.email) AS usuario_nome,
                      m.produto_id,
                      p.sku AS produto_sku,
                      p.nome AS produto_nome,
                      m.tipo,
                      m.origem,
                      m.origem_id,
                      m.origem_ref,
                      m.quantidade,
                      m.saldo_anterior,
                      m.saldo_posterior,
                      m.status,
                      m.movimento_origem_id,
                      m.local_origem,
                      m.local_destino,
                      m.observacao
                    FROM estoque_movimentacao m
                    LEFT JOIN produtos p ON p.id = m.produto_id
                    LEFT JOIN usuarios u ON u.id = m.usuario_id
                    """);
        } catch (Exception ignored) {
            /* ambiente sem MySQL ou tabela ainda não criada */
        }
    }

    private void adicionar(Connection conexao, Statement stmt, String coluna, String ddl) throws Exception {
        if (existe(conexao, coluna)) {
            return;
        }
        stmt.execute(ddl);
    }

    private boolean existe(Connection conexao, String coluna) throws Exception {
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacao' AND column_name = ?"
        )) {
            ps.setString(1, coluna);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }
}
