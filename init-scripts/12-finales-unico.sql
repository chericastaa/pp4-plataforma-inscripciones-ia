USE academic_db;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = 'academic_db' AND table_name = 'inscripciones_finales' AND index_name = 'mesa_alumno') > 0
  OR (SELECT COUNT(*) FROM (SELECT 1 FROM inscripciones_finales GROUP BY mesa_id, user_id HAVING COUNT(*) > 1) d) > 0,
  'SELECT 1',
  'ALTER TABLE inscripciones_finales ADD UNIQUE KEY mesa_alumno (mesa_id, user_id)'
);
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;
