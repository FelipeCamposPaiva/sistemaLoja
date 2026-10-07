package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class MaquinaSchema {

    private final DataSource dataSource;

    public MaquinaSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquinas (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      nome VARCHAR(180) NOT NULL,
                      detalhe VARCHAR(500) DEFAULT NULL,
                      tipo VARCHAR(80) DEFAULT NULL,
                      modelo VARCHAR(120) DEFAULT NULL,
                      marca VARCHAR(120) DEFAULT NULL,
                      localizacao VARCHAR(120) DEFAULT NULL,
                      status VARCHAR(20) DEFAULT 'operacao',
                      prox_manutencao DATE DEFAULT NULL,
                      horas_uso INT DEFAULT 0,
                      bem_id BIGINT DEFAULT NULL,
                      numero_serie VARCHAR(80) DEFAULT NULL,
                      valor_compra DECIMAL(12,2) DEFAULT 0,
                      data_compra DATE DEFAULT NULL,
                      fornecedor VARCHAR(180) DEFAULT NULL,
                      fornecedor_id BIGINT DEFAULT NULL,
                      nota_entrada_id BIGINT DEFAULT NULL,
                      nota_fiscal VARCHAR(40) DEFAULT NULL,
                      garantia_ate DATE DEFAULT NULL,
                      previsao_retorno DATE DEFAULT NULL,
                      ultima_utilizacao DATETIME DEFAULT NULL,
                      energia_kwh DECIMAL(10,2) DEFAULT 0,
                      energia_valor DECIMAL(12,2) DEFAULT 0,
                      material_media DECIMAL(10,3) DEFAULT 0,
                      material_unidade VARCHAR(10) DEFAULT NULL,
                      material_valor DECIMAL(12,2) DEFAULT 0,
                      observacao TEXT,
                      codigo_publico VARCHAR(40) DEFAULT NULL,
                      PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            adicionar(conexao, stmt, "maquinas", "numero_serie", "ALTER TABLE maquinas ADD COLUMN numero_serie VARCHAR(80) DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "valor_compra", "ALTER TABLE maquinas ADD COLUMN valor_compra DECIMAL(12,2) DEFAULT 0");
            adicionar(conexao, stmt, "maquinas", "data_compra", "ALTER TABLE maquinas ADD COLUMN data_compra DATE DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "fornecedor", "ALTER TABLE maquinas ADD COLUMN fornecedor VARCHAR(180) DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "fornecedor_id", "ALTER TABLE maquinas ADD COLUMN fornecedor_id BIGINT DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "nota_entrada_id", "ALTER TABLE maquinas ADD COLUMN nota_entrada_id BIGINT DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "nota_fiscal", "ALTER TABLE maquinas ADD COLUMN nota_fiscal VARCHAR(40) DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "garantia_ate", "ALTER TABLE maquinas ADD COLUMN garantia_ate DATE DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "previsao_retorno", "ALTER TABLE maquinas ADD COLUMN previsao_retorno DATE DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "ultima_utilizacao", "ALTER TABLE maquinas ADD COLUMN ultima_utilizacao DATETIME DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "energia_kwh", "ALTER TABLE maquinas ADD COLUMN energia_kwh DECIMAL(10,2) DEFAULT 0");
            adicionar(conexao, stmt, "maquinas", "energia_valor", "ALTER TABLE maquinas ADD COLUMN energia_valor DECIMAL(12,2) DEFAULT 0");
            adicionar(conexao, stmt, "maquinas", "material_media", "ALTER TABLE maquinas ADD COLUMN material_media DECIMAL(10,3) DEFAULT 0");
            adicionar(conexao, stmt, "maquinas", "material_unidade", "ALTER TABLE maquinas ADD COLUMN material_unidade VARCHAR(10) DEFAULT NULL");
            adicionar(conexao, stmt, "maquinas", "material_valor", "ALTER TABLE maquinas ADD COLUMN material_valor DECIMAL(12,2) DEFAULT 0");
            adicionar(conexao, stmt, "maquinas", "observacao", "ALTER TABLE maquinas ADD COLUMN observacao TEXT");
            adicionar(conexao, stmt, "maquinas", "codigo_publico", "ALTER TABLE maquinas ADD COLUMN codigo_publico VARCHAR(40) DEFAULT NULL");
            try {
                stmt.execute("ALTER TABLE maquinas MODIFY detalhe VARCHAR(500) NULL");
                stmt.execute("ALTER TABLE maquinas MODIFY tipo VARCHAR(80) NULL");
            } catch (Exception ignored) {
                /* coluna ainda no tamanho antigo */
            }
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_fotos (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      maquina_id BIGINT NOT NULL,
                      arquivo VARCHAR(500) DEFAULT NULL,
                      legenda VARCHAR(180) DEFAULT NULL,
                      ordem INT DEFAULT 0,
                      PRIMARY KEY (id),
                      KEY maquina_id (maquina_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_consumiveis (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      maquina_id BIGINT NOT NULL,
                      nome VARCHAR(120) DEFAULT NULL,
                      atual DECIMAL(12,3) DEFAULT 0,
                      capacidade DECIMAL(12,3) DEFAULT 0,
                      unidade VARCHAR(10) DEFAULT NULL,
                      cor VARCHAR(20) DEFAULT NULL,
                      PRIMARY KEY (id),
                      KEY maquina_id (maquina_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_manutencoes (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      maquina_id BIGINT NOT NULL,
                      data DATE DEFAULT NULL,
                      tipo VARCHAR(40) DEFAULT NULL,
                      descricao TEXT,
                      responsavel VARCHAR(120) DEFAULT NULL,
                      custo DECIMAL(12,2) DEFAULT 0,
                      status VARCHAR(30) DEFAULT NULL,
                      previsao_retorno DATE DEFAULT NULL,
                      peca VARCHAR(180) DEFAULT NULL,
                      PRIMARY KEY (id),
                      KEY maquina_id (maquina_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_manutencao_fotos (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      manutencao_id BIGINT NOT NULL,
                      arquivo VARCHAR(500) DEFAULT NULL,
                      PRIMARY KEY (id),
                      KEY manutencao_id (manutencao_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_documentos (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      maquina_id BIGINT NOT NULL,
                      nome VARCHAR(180) DEFAULT NULL,
                      arquivo VARCHAR(500) DEFAULT NULL,
                      tipo VARCHAR(40) DEFAULT NULL,
                      PRIMARY KEY (id),
                      KEY maquina_id (maquina_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS maquina_checklist (
                      id BIGINT NOT NULL AUTO_INCREMENT,
                      maquina_id BIGINT NOT NULL,
                      titulo VARCHAR(180) NOT NULL,
                      periodicidade VARCHAR(20) NOT NULL,
                      ordem INT DEFAULT 0,
                      ultima_execucao DATE DEFAULT NULL,
                      responsavel VARCHAR(120) DEFAULT NULL,
                      PRIMARY KEY (id),
                      KEY maquina_id (maquina_id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
            garantirCodigos(conexao);
            try {
                stmt.execute("CREATE UNIQUE INDEX uk_maquinas_codigo ON maquinas (codigo_publico)");
            } catch (Exception ignored) {
                /* índice já existe */
            }
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM maquinas")) {
                if (rs.next() && rs.getLong(1) == 0) {
                    semear(conexao);
                }
            }
            completarDemo(conexao);
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
        }
    }

    private void semear(Connection conexao) throws Exception {
        String sql = """
                INSERT INTO maquinas
                (nome, detalhe, tipo, modelo, marca, localizacao, status, prox_manutencao, horas_uso)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        Object[][] linhas = {
                {"Epson WorkForce 5710", "Impressora Jato de Tinta", "Impressora", "WorkForce 5710", "Epson", "Produção (AL)", "operacao", "2026-10-15", 1250},
                {"Epson L3150", "Impressora Multifuncional", "Impressora", "L3150", "Epson", "Produção (STG)", "operacao", "2026-10-20", 980},
                {"Epson L1800", "Impressora Fotográfica", "Impressora", "L1800", "Epson", "Produção (AL)", "operacao", "2026-10-18", 1430},
                {"Plotter T3150", "Plotter de Impressão", "Plotter", "T3150", "Epson", "Produção (AL)", "operacao", "2026-10-25", 2100},
                {"Creality MAGE S 14K", "Impressora 3D", "Impressora 3D", "MAGE S 14K", "Creality", "Produção (STG)", "manutencao", "2026-10-05", 780},
                {"Sonic Touch 33W", "Máquina a Laser", "Laser", "ScoopFan2033OA", "Sonic", "Produção (STG)", "operacao", "2026-10-22", 1560},
                {"Prensa Térmica", "Prensa para Sublimação", "Prensa", "38x38", "Genérica", "Produção (AL)", "operacao", "2026-10-10", 620},
                {"Guilhotina", "Corte de Papel", "Corte", "Guilhotina 45cm", "Excentrix", "Produção (AL)", "inativa", null, 31}
        };
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
            for (Object[] linha : linhas) {
                for (int i = 0; i < linha.length; i++) {
                    ps.setObject(i + 1, linha[i]);
                }
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    private void completarDemo(Connection conexao) throws Exception {
        Long id = null;
        try (PreparedStatement ps = conexao.prepareStatement(
                "SELECT id FROM maquinas WHERE nome = 'Creality MAGE S 14K' AND (numero_serie IS NULL OR numero_serie = '') LIMIT 1")) {
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    id = rs.getLong(1);
                }
            }
        }
        if (id == null) {
            return;
        }
        boolean auto = conexao.getAutoCommit();
        conexao.setAutoCommit(false);
        try {
        try (PreparedStatement ps = conexao.prepareStatement("""
                UPDATE maquinas SET
                  detalhe = ?,
                  numero_serie = ?,
                  valor_compra = ?,
                  data_compra = ?,
                  fornecedor = ?,
                  nota_fiscal = ?,
                  garantia_ate = ?,
                  previsao_retorno = ?,
                  ultima_utilizacao = ?,
                  energia_kwh = ?,
                  energia_valor = ?,
                  material_media = ?,
                  material_unidade = ?,
                  material_valor = ?,
                  prox_manutencao = ?
                WHERE id = ?
                """)) {
            ps.setString(1, "Impressora 3D de alta resolução para produção de personalizados e protótipos.");
            ps.setString(2, "CR-MAGE14K-001");
            ps.setBigDecimal(3, new java.math.BigDecimal("2850.00"));
            ps.setDate(4, java.sql.Date.valueOf("2025-08-15"));
            ps.setString(5, "CREALITY BRASIL");
            ps.setString(6, "NF-001234");
            ps.setDate(7, java.sql.Date.valueOf("2026-08-15"));
            ps.setDate(8, java.sql.Date.valueOf("2026-10-10"));
            ps.setTimestamp(9, java.sql.Timestamp.valueOf("2026-10-02 14:32:00"));
            ps.setBigDecimal(10, new java.math.BigDecimal("48.50"));
            ps.setBigDecimal(11, new java.math.BigDecimal("36.40"));
            ps.setBigDecimal(12, new java.math.BigDecimal("1.800"));
            ps.setString(13, "kg");
            ps.setBigDecimal(14, new java.math.BigDecimal("142.00"));
            ps.setDate(15, java.sql.Date.valueOf("2026-11-15"));
            ps.setLong(16, id);
            ps.executeUpdate();
        }
        try (PreparedStatement ps = conexao.prepareStatement(
                "INSERT INTO maquina_consumiveis (maquina_id, nome, atual, capacidade, unidade, cor) VALUES (?, ?, ?, ?, ?, ?)")) {
            Object[][] linhas = {
                    {id, "Resina 14K Cinza", new java.math.BigDecimal("680"), new java.math.BigDecimal("1000"), "ml", "#6b7280"},
                    {id, "Resina 14K Preta", new java.math.BigDecimal("320"), new java.math.BigDecimal("1000"), "ml", "#111827"}
            };
            for (Object[] linha : linhas) {
                for (int i = 0; i < linha.length; i++) {
                    ps.setObject(i + 1, linha[i]);
                }
                ps.addBatch();
            }
            ps.executeBatch();
        }
        try (PreparedStatement ps = conexao.prepareStatement("""
                INSERT INTO maquina_manutencoes
                (maquina_id, data, tipo, descricao, responsavel, custo, status, previsao_retorno, peca)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """)) {
            Object[][] linhas = {
                    {id, java.sql.Date.valueOf("2026-09-28"), "Corretiva", "Troca do filme FEP e nivelamento da mesa.", "Produção", new java.math.BigDecimal("180.00"), "Em andamento", java.sql.Date.valueOf("2026-10-10"), "Filme FEP"},
                    {id, java.sql.Date.valueOf("2026-08-12"), "Preventiva", "Limpeza do tanque e do filtro de resina.", "Produção", new java.math.BigDecimal("0.00"), "Concluída", null, ""},
                    {id, java.sql.Date.valueOf("2026-06-02"), "Troca de peça", "Substituição do LCD 14K.", "Assistência", new java.math.BigDecimal("640.00"), "Concluída", null, "LCD 14K"},
                    {id, java.sql.Date.valueOf("2026-04-18"), "Preventiva", "Calibração do eixo Z.", "Produção", new java.math.BigDecimal("0.00"), "Concluída", null, ""},
                    {id, java.sql.Date.valueOf("2026-02-03"), "Corretiva", "Substituição da fonte.", "Assistência", new java.math.BigDecimal("210.00"), "Concluída", null, "Fonte"}
            };
            for (Object[] linha : linhas) {
                for (int i = 0; i < linha.length; i++) {
                    ps.setObject(i + 1, linha[i]);
                }
                ps.addBatch();
            }
            ps.executeBatch();
        }
            conexao.commit();
        } catch (Exception ex) {
            conexao.rollback();
            throw ex;
        } finally {
            conexao.setAutoCommit(auto);
        }
    }

    private void garantirCodigos(Connection conexao) throws Exception {
        List<Long> semCodigo = new ArrayList<>();
        try (Statement stmt = conexao.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id FROM maquinas WHERE codigo_publico IS NULL OR codigo_publico = ''")) {
            while (rs.next()) {
                semCodigo.add(rs.getLong(1));
            }
        }
        for (Long id : semCodigo) {
            String codigo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            try (PreparedStatement ps = conexao.prepareStatement("UPDATE maquinas SET codigo_publico = ? WHERE id = ?")) {
                ps.setString(1, codigo);
                ps.setLong(2, id);
                ps.executeUpdate();
            }
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
        try (PreparedStatement ps = conexao.prepareStatement(sql)) {
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
