SET NAMES utf8mb4;

USE academic_db;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'academic_db' AND table_name = 'correlativas' AND column_name = 'para_cursar') = 0,
  'ALTER TABLE correlativas
     ADD COLUMN para_cursar ENUM(''regular'',''aprobada'') NOT NULL DEFAULT ''regular'',
     ADD COLUMN para_final ENUM(''regular'',''aprobada'') NOT NULL DEFAULT ''aprobada''',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

CREATE TABLE IF NOT EXISTS equivalencias (
  id int NOT NULL AUTO_INCREMENT,
  materia_id int NOT NULL,
  materia_equivalente_id int NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY par_unico (materia_id, materia_equivalente_id),
  KEY materia_equivalente_id (materia_equivalente_id),
  CONSTRAINT equivalencias_ibfk_1 FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE,
  CONSTRAINT equivalencias_ibfk_2 FOREIGN KEY (materia_equivalente_id) REFERENCES materias (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO equivalencias (materia_id, materia_equivalente_id)
SELECT a.id, b.id
FROM materias a
JOIN materias b ON a.nombre = b.nombre AND a.carrera_id = 1 AND b.carrera_id = 2;
