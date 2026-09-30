-- Juros e multa de boletos vencidos (ideia 27513).
-- O schema também é aplicado em JurosMultaSchema.java no boot.

CREATE TABLE IF NOT EXISTS financeiro_parametros (
  id INT NOT NULL,
  multa_percentual DECIMAL(7,4) NOT NULL DEFAULT 2.0000,
  juros_mes_percentual DECIMAL(7,4) NOT NULL DEFAULT 1.0000,
  carencia_dias INT NOT NULL DEFAULT 0,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO financeiro_parametros (id, multa_percentual, juros_mes_percentual, carencia_dias)
VALUES (1, 2.0000, 1.0000, 0);
