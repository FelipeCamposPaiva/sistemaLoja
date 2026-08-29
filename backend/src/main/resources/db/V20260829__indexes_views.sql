-- ERP Tem de Tudo — índices, FKs consistentes e views
-- MySQL 8.0.45 (sem CREATE INDEX IF NOT EXISTS nativo)
-- Idempotente: pode reaplicar. Não contém senhas.
-- Aplicar: mysql -u... temdetudo_db -e "source .../V20260829__indexes_views.sql"

SET NAMES utf8mb4;
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Tabela alinhada à entidade JPA AgendaEvento (a tabela legado é `agenda`)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda_eventos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(200) DEFAULT NULL,
  tipo VARCHAR(50) DEFAULT NULL,
  data_evento DATE DEFAULT NULL,
  descricao VARCHAR(1000) DEFAULT NULL,
  cor VARCHAR(30) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Helpers idempotentes
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS erp_create_index_if_missing;
DROP PROCEDURE IF EXISTS erp_add_fk_if_missing;

DELIMITER $$

CREATE PROCEDURE erp_create_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_ddl TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND index_name = p_index
  ) THEN
    SET @erp_idx_sql = p_ddl;
    PREPARE erp_idx_stmt FROM @erp_idx_sql;
    EXECUTE erp_idx_stmt;
    DEALLOCATE PREPARE erp_idx_stmt;
  END IF;
END$$

CREATE PROCEDURE erp_add_fk_if_missing(
  IN p_table VARCHAR(64),
  IN p_constraint VARCHAR(64),
  IN p_ddl TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND constraint_name = p_constraint
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    SET @erp_fk_sql = p_ddl;
    PREPARE erp_fk_stmt FROM @erp_fk_sql;
    EXECUTE erp_fk_stmt;
    DEALLOCATE PREPARE erp_fk_stmt;
  END IF;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------------
-- FKs (somente onde os tipos batem; não recria FKs já existentes)
-- FKs legado mantidas: contas_* → contatos, ordens_servico.cliente_id → contatos,
-- estoque → produtos/locais, orcamentos → clientes
-- ---------------------------------------------------------------------------
CALL erp_add_fk_if_missing('produtos', 'fk_produtos_marca',
  'ALTER TABLE produtos ADD CONSTRAINT fk_produtos_marca FOREIGN KEY (marca_id) REFERENCES marcas (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('produtos', 'fk_produtos_local',
  'ALTER TABLE produtos ADD CONSTRAINT fk_produtos_local FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('estoque_movimentacao', 'fk_estq_mov_produto',
  'ALTER TABLE estoque_movimentacao ADD CONSTRAINT fk_estq_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('estoque_movimentacao', 'fk_estq_mov_local_origem',
  'ALTER TABLE estoque_movimentacao ADD CONSTRAINT fk_estq_mov_local_origem FOREIGN KEY (local_origem) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('estoque_movimentacao', 'fk_estq_mov_local_destino',
  'ALTER TABLE estoque_movimentacao ADD CONSTRAINT fk_estq_mov_local_destino FOREIGN KEY (local_destino) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('estoque_movimentacao', 'fk_estq_mov_usuario',
  'ALTER TABLE estoque_movimentacao ADD CONSTRAINT fk_estq_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('inventarios', 'fk_inventarios_local',
  'ALTER TABLE inventarios ADD CONSTRAINT fk_inventarios_local FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('inventarios', 'fk_inventarios_usuario',
  'ALTER TABLE inventarios ADD CONSTRAINT fk_inventarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('inventario_itens', 'fk_inventario_itens_inv',
  'ALTER TABLE inventario_itens ADD CONSTRAINT fk_inventario_itens_inv FOREIGN KEY (inventario_id) REFERENCES inventarios (id) ON DELETE CASCADE ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('inventario_itens', 'fk_inventario_itens_prod',
  'ALTER TABLE inventario_itens ADD CONSTRAINT fk_inventario_itens_prod FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('notas_entrada', 'fk_notas_entrada_oc',
  'ALTER TABLE notas_entrada ADD CONSTRAINT fk_notas_entrada_oc FOREIGN KEY (ordem_compra_id) REFERENCES ordens_compra (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('notas_entrada_itens', 'fk_notas_entrada_itens_nota',
  'ALTER TABLE notas_entrada_itens ADD CONSTRAINT fk_notas_entrada_itens_nota FOREIGN KEY (nota_entrada_id) REFERENCES notas_entrada (id) ON DELETE CASCADE ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('contas_pagar', 'fk_contas_pagar_nota',
  'ALTER TABLE contas_pagar ADD CONSTRAINT fk_contas_pagar_nota FOREIGN KEY (nota_entrada_id) REFERENCES notas_entrada (id) ON DELETE SET NULL ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('producao', 'fk_producao_os',
  'ALTER TABLE producao ADD CONSTRAINT fk_producao_os FOREIGN KEY (os_id) REFERENCES ordens_servico (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('producao', 'fk_producao_local',
  'ALTER TABLE producao ADD CONSTRAINT fk_producao_local FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('ordens_servico', 'fk_os_status',
  'ALTER TABLE ordens_servico ADD CONSTRAINT fk_os_status FOREIGN KEY (status_id) REFERENCES os_status (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('ordens_servico', 'fk_os_local',
  'ALTER TABLE ordens_servico ADD CONSTRAINT fk_os_local FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('os_itens', 'fk_os_itens_os',
  'ALTER TABLE os_itens ADD CONSTRAINT fk_os_itens_os FOREIGN KEY (os_id) REFERENCES ordens_servico (id) ON DELETE CASCADE ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('os_historico', 'fk_os_historico_os',
  'ALTER TABLE os_historico ADD CONSTRAINT fk_os_historico_os FOREIGN KEY (os_id) REFERENCES ordens_servico (id) ON DELETE CASCADE ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('os_historico', 'fk_os_historico_usuario',
  'ALTER TABLE os_historico ADD CONSTRAINT fk_os_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('os_arquivos', 'fk_os_arquivos_os',
  'ALTER TABLE os_arquivos ADD CONSTRAINT fk_os_arquivos_os FOREIGN KEY (os_id) REFERENCES ordens_servico (id) ON DELETE CASCADE ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('pedidos_venda', 'fk_pedidos_venda_cliente',
  'ALTER TABLE pedidos_venda ADD CONSTRAINT fk_pedidos_venda_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('pedidos_venda', 'fk_pedidos_venda_local',
  'ALTER TABLE pedidos_venda ADD CONSTRAINT fk_pedidos_venda_local FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE SET NULL ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('pedidos_venda_itens', 'fk_pvi_pedido',
  'ALTER TABLE pedidos_venda_itens ADD CONSTRAINT fk_pvi_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos_venda (id) ON DELETE CASCADE ON UPDATE CASCADE');
CALL erp_add_fk_if_missing('pedidos_venda_itens', 'fk_pvi_produto',
  'ALTER TABLE pedidos_venda_itens ADD CONSTRAINT fk_pvi_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT ON UPDATE CASCADE');

CALL erp_add_fk_if_missing('agenda', 'fk_agenda_usuario',
  'ALTER TABLE agenda ADD CONSTRAINT fk_agenda_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE');

-- FKs NÃO criadas (tipo incompatível INT vs BIGINT) — só índice:
--   produtos.fornecedor_id, notas_entrada.fornecedor_id, ordens_compra.fornecedor_id
--   ordem_compra_itens.ordem_id, notas_entrada_itens.produto_id
--   os_consumo.os_id / produto_id, localizacoes.local_id

-- ---------------------------------------------------------------------------
-- Índices de busca / operação (pula se o nome já existir; FKs já indexam a coluna)
-- ---------------------------------------------------------------------------
CALL erp_create_index_if_missing('produtos', 'uk_produtos_sku',
  'CREATE UNIQUE INDEX uk_produtos_sku ON produtos (sku)');
CALL erp_create_index_if_missing('produtos', 'uk_produtos_codigo_barras',
  'CREATE UNIQUE INDEX uk_produtos_codigo_barras ON produtos (codigo_barras)');
CALL erp_create_index_if_missing('produtos', 'idx_produtos_nome',
  'CREATE INDEX idx_produtos_nome ON produtos (nome)');
CALL erp_create_index_if_missing('produtos', 'idx_produtos_categoria',
  'CREATE INDEX idx_produtos_categoria ON produtos (categoria)');
CALL erp_create_index_if_missing('produtos', 'idx_produtos_ativo',
  'CREATE INDEX idx_produtos_ativo ON produtos (ativo)');
CALL erp_create_index_if_missing('produtos', 'idx_produtos_fornecedor_id',
  'CREATE INDEX idx_produtos_fornecedor_id ON produtos (fornecedor_id)');

CALL erp_create_index_if_missing('categorias', 'uk_categorias_nome',
  'CREATE UNIQUE INDEX uk_categorias_nome ON categorias (nome)');
CALL erp_create_index_if_missing('marcas', 'uk_marcas_nome',
  'CREATE UNIQUE INDEX uk_marcas_nome ON marcas (nome)');
CALL erp_create_index_if_missing('clientes', 'uk_clientes_cpf_cnpj',
  'CREATE UNIQUE INDEX uk_clientes_cpf_cnpj ON clientes (cpf_cnpj)');
CALL erp_create_index_if_missing('clientes', 'idx_clientes_nome',
  'CREATE INDEX idx_clientes_nome ON clientes (nome)');
CALL erp_create_index_if_missing('fornecedores', 'uk_fornecedores_cnpj',
  'CREATE UNIQUE INDEX uk_fornecedores_cnpj ON fornecedores (cnpj)');
CALL erp_create_index_if_missing('localizacoes', 'uk_localizacoes_codigo',
  'CREATE UNIQUE INDEX uk_localizacoes_codigo ON localizacoes (codigo)');
CALL erp_create_index_if_missing('localizacoes', 'idx_localizacoes_local_id',
  'CREATE INDEX idx_localizacoes_local_id ON localizacoes (local_id)');

CALL erp_create_index_if_missing('estoque', 'uk_estoque_produto_local',
  'CREATE UNIQUE INDEX uk_estoque_produto_local ON estoque (produto_id, local_id)');
CALL erp_create_index_if_missing('estoque_movimentacao', 'idx_estq_mov_produto_data',
  'CREATE INDEX idx_estq_mov_produto_data ON estoque_movimentacao (produto_id, data_movimento)');

CALL erp_create_index_if_missing('ordens_compra', 'idx_ordens_compra_fornecedor',
  'CREATE INDEX idx_ordens_compra_fornecedor ON ordens_compra (fornecedor_id)');
CALL erp_create_index_if_missing('ordens_compra', 'idx_ordens_compra_status',
  'CREATE INDEX idx_ordens_compra_status ON ordens_compra (status)');
CALL erp_create_index_if_missing('ordem_compra_itens', 'idx_oci_ordem_id',
  'CREATE INDEX idx_oci_ordem_id ON ordem_compra_itens (ordem_id)');
CALL erp_create_index_if_missing('ordem_compra_itens', 'idx_oci_produto_id',
  'CREATE INDEX idx_oci_produto_id ON ordem_compra_itens (produto_id)');

CALL erp_create_index_if_missing('notas_entrada', 'idx_notas_entrada_fornecedor',
  'CREATE INDEX idx_notas_entrada_fornecedor ON notas_entrada (fornecedor_id)');
CALL erp_create_index_if_missing('notas_entrada', 'idx_notas_entrada_status',
  'CREATE INDEX idx_notas_entrada_status ON notas_entrada (status)');
CALL erp_create_index_if_missing('notas_entrada_itens', 'idx_nei_produto_id',
  'CREATE INDEX idx_nei_produto_id ON notas_entrada_itens (produto_id)');

-- contas_pagar já tem idx_fornecedor, idx_nota
CALL erp_create_index_if_missing('contas_pagar', 'idx_contas_pagar_status_venc',
  'CREATE INDEX idx_contas_pagar_status_venc ON contas_pagar (status, vencimento)');
-- contas_receber já tem idx_cliente
CALL erp_create_index_if_missing('contas_receber', 'idx_contas_receber_status_venc',
  'CREATE INDEX idx_contas_receber_status_venc ON contas_receber (status, vencimento)');

CALL erp_create_index_if_missing('caixa', 'idx_caixa_data_tipo',
  'CREATE INDEX idx_caixa_data_tipo ON caixa (data_movimento, tipo)');

-- ordens_servico já tem KEY cliente_id
CALL erp_create_index_if_missing('ordens_servico', 'idx_os_status',
  'CREATE INDEX idx_os_status ON ordens_servico (status)');
CALL erp_create_index_if_missing('ordens_servico', 'idx_os_numero',
  'CREATE INDEX idx_os_numero ON ordens_servico (numero)');
CALL erp_create_index_if_missing('os_consumo', 'idx_os_consumo_os_id',
  'CREATE INDEX idx_os_consumo_os_id ON os_consumo (os_id)');
CALL erp_create_index_if_missing('os_consumo', 'idx_os_consumo_produto_id',
  'CREATE INDEX idx_os_consumo_produto_id ON os_consumo (produto_id)');

CALL erp_create_index_if_missing('pedidos_venda', 'idx_pedidos_venda_status',
  'CREATE INDEX idx_pedidos_venda_status ON pedidos_venda (status)');
CALL erp_create_index_if_missing('agenda', 'idx_agenda_data_inicio',
  'CREATE INDEX idx_agenda_data_inicio ON agenda (data_inicio)');
CALL erp_create_index_if_missing('agenda_eventos', 'idx_agenda_eventos_data',
  'CREATE INDEX idx_agenda_eventos_data ON agenda_eventos (data_evento)');
CALL erp_create_index_if_missing('agenda_eventos', 'idx_agenda_eventos_tipo',
  'CREATE INDEX idx_agenda_eventos_tipo ON agenda_eventos (tipo)');

-- producao já tem idx_producao_status, idx_producao_os, idx_producao_entrega
-- usuarios já tem UNIQUE email, usuario

DROP PROCEDURE IF EXISTS erp_create_index_if_missing;
DROP PROCEDURE IF EXISTS erp_add_fk_if_missing;

-- ---------------------------------------------------------------------------
-- Views de leitura (API / dashboard)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_produtos_estoque AS
SELECT
  p.id AS produto_id,
  p.sku,
  p.codigo_barras,
  p.nome,
  p.categoria,
  p.unidade,
  p.estoque,
  p.estoque_minimo,
  p.estoque_maximo,
  p.preco,
  p.custo,
  p.custo_medio,
  p.marca_id,
  m.nome AS marca_nome,
  p.local_id,
  l.nome AS local_nome,
  l.sigla AS local_sigla,
  p.localizacao,
  p.fornecedor_id,
  p.ativo,
  CASE
    WHEN p.estoque IS NULL THEN 0
    WHEN p.estoque_minimo IS NOT NULL AND p.estoque_minimo > 0 AND p.estoque <= p.estoque_minimo THEN 1
    ELSE 0
  END AS estoque_baixo,
  CASE
    WHEN p.estoque_maximo IS NOT NULL AND p.estoque >= p.estoque_maximo THEN 1
    ELSE 0
  END AS estoque_acima_maximo
FROM produtos p
LEFT JOIN marcas m ON m.id = p.marca_id
LEFT JOIN locais l ON l.id = p.local_id;

CREATE OR REPLACE VIEW vw_estoque_baixo AS
SELECT *
FROM vw_produtos_estoque
WHERE estoque_baixo = 1
  AND (ativo IS NULL OR ativo = 1);

CREATE OR REPLACE VIEW vw_contas_abertas AS
SELECT
  'PAGAR' AS tipo_conta,
  cp.id,
  cp.fornecedor_id AS pessoa_id,
  COALESCE(f.razao_social, f.nome_fantasia, ct.nome) AS pessoa_nome,
  cp.valor,
  cp.vencimento,
  cp.status,
  cp.nota_entrada_id,
  cp.data_pagamento AS data_liquidacao,
  CASE WHEN cp.vencimento IS NOT NULL AND cp.vencimento < CURDATE() THEN 1 ELSE 0 END AS vencida
FROM contas_pagar cp
LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
LEFT JOIN contatos ct ON ct.id = cp.fornecedor_id
WHERE cp.status IS NULL
   OR UPPER(cp.status) NOT IN ('PAGO', 'CANCELADO', 'QUITADO')

UNION ALL

SELECT
  'RECEBER' AS tipo_conta,
  cr.id,
  cr.cliente_id AS pessoa_id,
  COALESCE(c.nome, c.nome_fantasia, ct.nome) AS pessoa_nome,
  cr.valor,
  cr.vencimento,
  cr.status,
  NULL AS nota_entrada_id,
  cr.data_recebimento AS data_liquidacao,
  CASE WHEN cr.vencimento IS NOT NULL AND cr.vencimento < CURDATE() THEN 1 ELSE 0 END AS vencida
FROM contas_receber cr
LEFT JOIN clientes c ON c.id = cr.cliente_id
LEFT JOIN contatos ct ON ct.id = cr.cliente_id
WHERE cr.status IS NULL
   OR UPPER(cr.status) NOT IN ('RECEBIDO', 'PAGO', 'CANCELADO', 'QUITADO');

CREATE OR REPLACE VIEW vw_os_resumo AS
SELECT
  os.id,
  os.numero,
  os.cliente_id,
  COALESCE(cli.nome, ct.nome) AS cliente_nome,
  os.status,
  os.status_id,
  st.nome AS status_nome,
  os.prioridade,
  os.valor,
  os.data_abertura,
  os.data_previsao,
  os.data_entrega,
  os.data_conclusao,
  os.responsavel,
  os.local_id,
  loc.nome AS local_nome,
  (SELECT COUNT(*) FROM os_itens i WHERE i.os_id = os.id) AS qtd_itens,
  (SELECT COUNT(*) FROM os_consumo c WHERE c.os_id = os.id) AS qtd_consumos,
  (SELECT COALESCE(SUM(c.quantidade), 0) FROM os_consumo c WHERE c.os_id = os.id) AS qtd_consumo_total
FROM ordens_servico os
LEFT JOIN clientes cli ON cli.id = os.cliente_id
LEFT JOIN contatos ct ON ct.id = os.cliente_id
LEFT JOIN os_status st ON st.id = os.status_id
LEFT JOIN locais loc ON loc.id = os.local_id;

CREATE OR REPLACE VIEW vw_caixa_resumo AS
SELECT
  DATE(data_movimento) AS data_ref,
  tipo,
  COUNT(*) AS qtd_lancamentos,
  COALESCE(SUM(valor), 0) AS total
FROM caixa
GROUP BY DATE(data_movimento), tipo;

CREATE OR REPLACE VIEW vw_producao_aberta AS
SELECT
  pr.id,
  pr.os_id,
  pr.cliente,
  pr.produto,
  pr.quantidade,
  pr.data_entrega,
  pr.prioridade,
  pr.responsavel,
  pr.etapa,
  pr.status,
  pr.inicio,
  pr.local_id,
  loc.nome AS local_nome
FROM producao pr
LEFT JOIN locais loc ON loc.id = pr.local_id
WHERE pr.status IS NULL
   OR UPPER(pr.status) NOT IN ('CONCLUIDO', 'CONCLUIDA', 'FINALIZADO', 'CANCELADO');

SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;
