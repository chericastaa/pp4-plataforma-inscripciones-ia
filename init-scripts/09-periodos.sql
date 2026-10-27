SET NAMES utf8mb4;

USE academic_db;

CREATE TABLE IF NOT EXISTS periodos (
  id int NOT NULL AUTO_INCREMENT,
  anio smallint NOT NULL,
  cuatrimestre tinyint NOT NULL,
  nombre varchar(60) NOT NULL,
  actual tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY periodo_unico (anio, cuatrimestre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO periodos (anio, cuatrimestre, nombre, actual) VALUES
(2025, 2, '2do cuatrimestre 2025', 0),
(2026, 1, '1er cuatrimestre 2026', 0),
(2026, 2, '2do cuatrimestre 2026', 0),
(2027, 1, '1er cuatrimestre 2027', 0);

UPDATE periodos SET actual = 1
WHERE anio = 2026 AND cuatrimestre = 2
AND (SELECT COUNT(*) FROM (SELECT id FROM periodos WHERE actual = 1) x) = 0;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'academic_db' AND table_name = 'inscripciones' AND column_name = 'periodo_id') = 0,
  'ALTER TABLE inscripciones ADD COLUMN periodo_id INT NULL, ADD KEY periodo_idx (user_id, materia_id, periodo_id)',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'academic_db' AND table_name = 'calificaciones' AND column_name = 'periodo_id') = 0,
  'ALTER TABLE calificaciones ADD COLUMN periodo_id INT NULL, ADD KEY periodo_idx (user_id, materia_id, periodo_id)',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

UPDATE inscripciones i
JOIN materias m ON m.id = i.materia_id
JOIN calificaciones c ON c.user_id = i.user_id AND c.materia_id = i.materia_id
JOIN periodos p ON p.anio = IF(m.cuatrimestre = 1, 2026, 2025) AND p.cuatrimestre = m.cuatrimestre
SET i.periodo_id = p.id
WHERE i.periodo_id IS NULL AND c.parcial1 IS NOT NULL AND c.parcial2 IS NOT NULL;

UPDATE inscripciones
SET periodo_id = (SELECT id FROM periodos WHERE actual = 1 LIMIT 1)
WHERE periodo_id IS NULL;

UPDATE calificaciones c
JOIN inscripciones i ON i.user_id = c.user_id AND i.materia_id = c.materia_id
SET c.periodo_id = i.periodo_id
WHERE c.periodo_id IS NULL;
