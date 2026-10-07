package com.temdetudo.erp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class NaturezaOperacaoSchema {

    private final DataSource dataSource;

    public NaturezaOperacaoSchema(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void alinhar() {
        try (Connection conexao = dataSource.getConnection(); Statement stmt = conexao.createStatement()) {
            stmt.execute("""
                    CREATE TABLE IF NOT EXISTS naturezas_operacao (
                      id INT NOT NULL AUTO_INCREMENT,
                      codigo VARCHAR(40) NOT NULL,
                      nome VARCHAR(180) NOT NULL,
                      cfop_interno VARCHAR(4) DEFAULT NULL,
                      cfop_interestadual VARCHAR(4) DEFAULT NULL,
                      tipo_documento VARCHAR(20) DEFAULT 'AMBOS',
                      para_contribuinte TINYINT(1) DEFAULT 0,
                      para_nao_contribuinte TINYINT(1) DEFAULT 1,
                      para_pessoa_fisica TINYINT(1) DEFAULT 1,
                      para_pessoa_juridica TINYINT(1) DEFAULT 1,
                      finalidade VARCHAR(20) DEFAULT 'AMBOS',
                      consumidor_final TINYINT(1) DEFAULT 0,
                      prioridade INT DEFAULT 50,
                      ativo TINYINT(1) DEFAULT 1,
                      PRIMARY KEY (id),
                      UNIQUE KEY uk_natureza_codigo (codigo)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """);
            adicionar(conexao, stmt, "clientes", "tipo_pessoa",
                    "ALTER TABLE clientes ADD COLUMN tipo_pessoa VARCHAR(20) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "contribuinte",
                    "ALTER TABLE clientes ADD COLUMN contribuinte VARCHAR(2) DEFAULT '9'");
            adicionar(conexao, stmt, "clientes", "ie",
                    "ALTER TABLE clientes ADD COLUMN ie VARCHAR(30) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "inscricao_municipal",
                    "ALTER TABLE clientes ADD COLUMN inscricao_municipal VARCHAR(30) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "inscricao_suframa",
                    "ALTER TABLE clientes ADD COLUMN inscricao_suframa VARCHAR(20) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "vendedor",
                    "ALTER TABLE clientes ADD COLUMN vendedor VARCHAR(150) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "vendedor_id",
                    "ALTER TABLE clientes ADD COLUMN vendedor_id BIGINT DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "condicao_pagamento",
                    "ALTER TABLE clientes ADD COLUMN condicao_pagamento VARCHAR(80) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "dia_pagamento",
                    "ALTER TABLE clientes ADD COLUMN dia_pagamento INT DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "lista_preco",
                    "ALTER TABLE clientes ADD COLUMN lista_preco VARCHAR(80) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "fundacao",
                    "ALTER TABLE clientes ADD COLUMN fundacao VARCHAR(10) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "foto",
                    "ALTER TABLE clientes ADD COLUMN foto MEDIUMTEXT");
            adicionar(conexao, stmt, "clientes", "anexos",
                    "ALTER TABLE clientes ADD COLUMN anexos MEDIUMTEXT");
            adicionar(conexao, stmt, "clientes", "dados_pessoais",
                    "ALTER TABLE clientes ADD COLUMN dados_pessoais TEXT");
            adicionar(conexao, stmt, "clientes", "consumidor_final",
                    "ALTER TABLE clientes ADD COLUMN consumidor_final TINYINT(1) DEFAULT 1");
            adicionar(conexao, stmt, "clientes", "finalidade",
                    "ALTER TABLE clientes ADD COLUMN finalidade VARCHAR(20) DEFAULT 'CONSUMO'");
            adicionar(conexao, stmt, "clientes", "regime_tributario",
                    "ALTER TABLE clientes ADD COLUMN regime_tributario VARCHAR(30) DEFAULT NULL");
            adicionar(conexao, stmt, "clientes", "natureza_operacao_id",
                    "ALTER TABLE clientes ADD COLUMN natureza_operacao_id INT DEFAULT NULL");
            adicionar(conexao, stmt, "pedidos_venda", "natureza_operacao_id",
                    "ALTER TABLE pedidos_venda ADD COLUMN natureza_operacao_id INT DEFAULT NULL");
            adicionar(conexao, stmt, "pedidos_venda", "natureza_operacao",
                    "ALTER TABLE pedidos_venda ADD COLUMN natureza_operacao VARCHAR(180) DEFAULT NULL");
            adicionar(conexao, stmt, "pedidos_venda", "cfop",
                    "ALTER TABLE pedidos_venda ADD COLUMN cfop VARCHAR(4) DEFAULT NULL");
            semear(stmt,
                    "VENDA_CONSUMIDOR",
                    "Venda de mercadorias de terceiros para consumidor final",
                    "5102", "6108", "AMBOS", 0, 1, 1, 1, "CONSUMO", 1, 10);
            semear(stmt,
                    "VENDA_CONTRIBUINTE",
                    "Venda de mercadorias de terceiros para contribuinte ICMS (revenda)",
                    "5102", "6102", "NFE", 1, 0, 0, 1, "REVENDA", 0, 20);
            semear(stmt,
                    "VENDA_CONSUMO_PJ",
                    "Venda de mercadorias de terceiros para consumo",
                    "5102", "6108", "NFE", 0, 1, 0, 1, "CONSUMO", 1, 15);
            semear(stmt,
                    "VENDA_PROPRIA",
                    "Venda de mercadoria própria / produção do estabelecimento",
                    "5101", "6101", "NFE", 1, 1, 1, 1, "AMBOS", 0, 40);
        } catch (Exception ignored) {
            /* ambiente sem MySQL */
        }
    }

    private void semear(
            Statement stmt,
            String codigo,
            String nome,
            String interno,
            String interestadual,
            String tipoDoc,
            int contrib,
            int naoContrib,
            int pf,
            int pj,
            String finalidade,
            int consumidor,
            int prioridade
    ) {
        try {
            stmt.execute("INSERT INTO naturezas_operacao (codigo, nome, cfop_interno, cfop_interestadual, tipo_documento,"
                    + " para_contribuinte, para_nao_contribuinte, para_pessoa_fisica, para_pessoa_juridica,"
                    + " finalidade, consumidor_final, prioridade, ativo) VALUES ('"
                    + codigo + "','" + nome + "','" + interno + "','" + interestadual + "','" + tipoDoc + "',"
                    + contrib + "," + naoContrib + "," + pf + "," + pj + ",'" + finalidade + "',"
                    + consumidor + "," + prioridade + ",1)");
        } catch (Exception ignored) {
            /* já cadastrada */
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
        try {
            stmt.execute(ddl);
        } catch (Exception ex) {
            /* uma coluna que falhar não impede as seguintes */
        }
    }
}
