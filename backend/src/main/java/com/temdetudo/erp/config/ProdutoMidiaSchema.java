package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class ProdutoMidiaSchema {

    private final DataSource dataSource;

    public ProdutoMidiaSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            adicionar(conexao, stmt, "produtos", "imagem",
                    "ALTER TABLE produtos ADD COLUMN imagem VARCHAR(500) DEFAULT NULL");
            adicionar(conexao, stmt, "produtos", "midia",
                    "ALTER TABLE produtos ADD COLUMN midia LONGTEXT NULL");
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS produto_midia (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      produto_id BIGINT NOT NULL,
                      tipo VARCHAR(20) NOT NULL,
                      nome VARCHAR(255) DEFAULT NULL,
                      mime VARCHAR(120) DEFAULT NULL,
                      tamanho BIGINT DEFAULT NULL,
                      arquivo VARCHAR(500) DEFAULT NULL,
                      url_externa VARCHAR(500) DEFAULT NULL,
                      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                      PRIMARY KEY (id),
                      KEY produto_id (produto_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS produto_anuncio (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      produto_id BIGINT NOT NULL,
                      canal VARCHAR(40) NOT NULL,
                      codigo VARCHAR(80) DEFAULT NULL,
                      status VARCHAR(40) DEFAULT NULL,
                      video_enviado TINYINT(1) DEFAULT 0,
                      fotos_enviadas INT DEFAULT 0,
                      video_remoto VARCHAR(120) DEFAULT NULL,
                      mensagem VARCHAR(500) DEFAULT NULL,
                      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                      PRIMARY KEY (id),
                      KEY produto_id (produto_id),
                      KEY canal (canal)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
        } catch (Exception ignored) {
            /* schema legado */
        }
    }

    private void adicionar(Connection conexao, Statement stmt, String tabela, String coluna, String sql) {
        try {
            if (existe(conexao, tabela, coluna)) {
                return;
            }
            stmt.execute(sql);
        } catch (Exception ignored) {
            /* coluna já existe */
        }
    }

    private boolean existe(Connection conexao, String tabela, String coluna) {
        String sql = "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";
        try (var ps = conexao.prepareStatement(sql)) {
            ps.setString(1, tabela);
            ps.setString(2, coluna);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (Exception ignored) {
            return false;
        }
    }
}
