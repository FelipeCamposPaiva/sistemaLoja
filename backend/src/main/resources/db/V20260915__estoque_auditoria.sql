-- ERP Tem de Tudo — auditoria de estoque (ideia 18502)
-- Idempotente. Aplicar: mysql -u root -p temdetudo_db < V20260915__estoque_auditoria.sql

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS erp_add_column_if_missing;

DELIMITER $$

CREATE PROCEDURE erp_add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_ddl TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND column_name = p_column
  ) THEN
    SET @erp_col_sql = p_ddl;
    PREPARE erp_col_stmt FROM @erp_col_sql;
    EXECUTE erp_col_stmt;
    DEALLOCATE PREPARE erp_col_stmt;
  END IF;
END$$

DROP PROCEDURE IF EXISTS erp_create_index_if_missing$$

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

DELIMITER ;

ALTER TABLE estoque_movimentacao
  MODIFY COLUMN tipo VARCHAR(30) DEFAULT NULL;

ALTER TABLE estoque_movimentacao
  MODIFY COLUMN quantidade DECIMAL(14,4) DEFAULT NULL;

CALL erp_add_column_if_missing('estoque_movimentacao', 'usuario_nome',
  'ALTER TABLE estoque_movimentacao ADD COLUMN usuario_nome VARCHAR(150) DEFAULT NULL AFTER usuario_id');

CALL erp_add_column_if_missing('estoque_movimentacao', 'origem',
  'ALTER TABLE estoque_movimentacao ADD COLUMN origem VARCHAR(30) DEFAULT ''MANUAL'' AFTER data_movimento');

CALL erp_add_column_if_missing('estoque_movimentacao', 'origem_id',
  'ALTER TABLE estoque_movimentacao ADD COLUMN origem_id BIGINT DEFAULT NULL AFTER origem');

CALL erp_add_column_if_missing('estoque_movimentacao', 'origem_ref',
  'ALTER TABLE estoque_movimentacao ADD COLUMN origem_ref VARCHAR(150) DEFAULT NULL AFTER origem_id');

CALL erp_add_column_if_missing('estoque_movimentacao', 'saldo_anterior',
  'ALTER TABLE estoque_movimentacao ADD COLUMN saldo_anterior DECIMAL(14,4) DEFAULT NULL AFTER origem_ref');

CALL erp_add_column_if_missing('estoque_movimentacao', 'saldo_posterior',
  'ALTER TABLE estoque_movimentacao ADD COLUMN saldo_posterior DECIMAL(14,4) DEFAULT NULL AFTER saldo_anterior');

CALL erp_add_column_if_missing('estoque_movimentacao', 'status',
  'ALTER TABLE estoque_movimentacao ADD COLUMN status VARCHAR(20) DEFAULT ''ATIVO'' AFTER saldo_posterior');

CALL erp_add_column_if_missing('estoque_movimentacao', 'movimento_origem_id',
  'ALTER TABLE estoque_movimentacao ADD COLUMN movimento_origem_id INT DEFAULT NULL AFTER status');

CALL erp_create_index_if_missing('estoque_movimentacao', 'idx_estq_mov_usuario_data',
  'CREATE INDEX idx_estq_mov_usuario_data ON estoque_movimentacao (usuario_id, data_movimento)');

CALL erp_create_index_if_missing('estoque_movimentacao', 'idx_estq_mov_origem',
  'CREATE INDEX idx_estq_mov_origem ON estoque_movimentacao (origem, origem_id)');

CALL erp_create_index_if_missing('estoque_movimentacao', 'idx_estq_mov_status',
  'CREATE INDEX idx_estq_mov_status ON estoque_movimentacao (status)');

CALL erp_create_index_if_missing('estoque_movimentacao', 'idx_estq_mov_produto_data',
  'CREATE INDEX idx_estq_mov_produto_data ON estoque_movimentacao (produto_id, data_movimento)');

UPDATE estoque_movimentacao
SET status = 'ATIVO'
WHERE status IS NULL OR status = '';

UPDATE estoque_movimentacao
SET origem = 'MANUAL'
WHERE origem IS NULL OR origem = '';

UPDATE estoque_movimentacao m
LEFT JOIN usuarios u ON u.id = m.usuario_id
SET m.usuario_nome = u.nome
WHERE (m.usuario_nome IS NULL OR m.usuario_nome = '')
  AND u.nome IS NOT NULL;

DROP PROCEDURE IF EXISTS erp_add_column_if_missing;
DROP PROCEDURE IF EXISTS erp_create_index_if_missing;

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
LEFT JOIN usuarios u ON u.id = m.usuario_id;
