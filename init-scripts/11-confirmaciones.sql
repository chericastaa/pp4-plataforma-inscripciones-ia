SET NAMES utf8mb4;

USE academic_db;

CREATE TABLE IF NOT EXISTS confirmaciones_pendientes (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  tipo varchar(20) NOT NULL,
  recurso_id int NOT NULL,
  estado varchar(20) NOT NULL DEFAULT 'pendiente',
  expira_en datetime NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY busqueda (user_id, tipo, recurso_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'academic_db' AND table_name = 'inscripciones_finales' AND column_name = 'ausente') = 0,
  'ALTER TABLE inscripciones_finales ADD COLUMN ausente TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;
