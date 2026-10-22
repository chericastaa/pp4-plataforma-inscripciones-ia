SET NAMES utf8mb4;

USE academic_db;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'academic_db' AND table_name = 'equivalencias' AND column_name = 'bidireccional') = 0,
  'ALTER TABLE equivalencias ADD COLUMN bidireccional TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

DELETE e FROM equivalencias e
JOIN materias a ON a.id = e.materia_id
JOIN materias b ON b.id = e.materia_equivalente_id
WHERE (a.carrera_id = 1 AND b.carrera_id = 2) OR (a.carrera_id = 2 AND b.carrera_id = 1);

INSERT INTO equivalencias (materia_id, materia_equivalente_id, bidireccional)
SELECT d.id, a.id, 0
FROM (
  SELECT '1.1.1' desarrollo, '1.1.1' analisis UNION ALL
  SELECT '1.1.2', '1.1.3' UNION ALL
  SELECT '1.2.1', '1.2.1' UNION ALL
  SELECT '1.1.3', '1.1.2' UNION ALL
  SELECT '1.1.4', '1.1.4' UNION ALL
  SELECT '1.2.2', '1.2.3' UNION ALL
  SELECT '1.2.4', '1.2.4' UNION ALL
  SELECT '2.1.4', '2.1.3' UNION ALL
  SELECT '3.1.4', '2.2.1' UNION ALL
  SELECT '2.2.3', '2.1.2' UNION ALL
  SELECT '3.1.3', '2.2.3'
) p
JOIN materias d ON d.codigo = p.desarrollo AND d.carrera_id = 1
JOIN materias a ON a.codigo = p.analisis AND a.carrera_id = 2;
