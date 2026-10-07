SET NAMES utf8mb4;

USE academic_db;

INSERT INTO carreras (id, nombre, resolucion) VALUES
(1, 'Tecnicatura Superior en Desarrollo de Software', 'Res. 2391/MEDGC/21'),
(2, 'Tecnicatura Superior en Análisis de Sistemas', NULL);

INSERT INTO materias (codigo, nombre, carrera_id, anio, cuatrimestre, dia, hora_inicio, hora_fin) VALUES
('1.1.1', 'Técnicas de Programación', 1, 1, 1, 'Lunes', '18:00', '21:00'),
('1.1.2', 'Administración de Bases de Datos', 1, 1, 1, 'Martes', '18:00', '21:00'),
('1.1.3', 'Elementos de Análisis Matemático', 1, 1, 1, 'Miércoles', '18:00', '20:00'),
('1.1.4', 'Lógica Computacional', 1, 1, 1, 'Jueves', '18:00', '20:00'),
('1.2.1', 'Desarrollo de Sistemas Orientado a Objetos', 1, 1, 2, 'Lunes', '18:00', '21:00'),
('1.2.2', 'Modelado y Diseño de Software', 1, 1, 2, 'Jueves', '19:00', '20:00'),
('1.2.3', 'Estadística y Probabilidades para el Desarrollo de Software', 1, 1, 2, 'Martes', '18:00', '20:00'),
('1.2.4', 'Inglés', 1, 1, 2, 'Miércoles', '18:00', '20:00'),
('1.2.5', 'PP I: Aproximación al Mundo Laboral', 1, 1, 2, 'Viernes', '18:00', '20:00'),
('2.1.1', 'Desarrollo de Aplicaciones para Dispositivos Móviles', 1, 2, 1, 'Lunes', '18:00', '21:00'),
('2.1.2', 'Metodología de Pruebas de Sistemas', 1, 2, 1, 'Martes', '18:00', '21:00'),
('2.1.3', 'Tecnologías de la Información y de la Comunicación', 1, 2, 1, 'Miércoles', '18:00', '19:00'),
('2.1.4', 'Taller de Comunicación', 1, 2, 1, 'Miércoles', '19:00', '20:00'),
('2.1.5', 'PP II: Sistemas de Información Orientados a la Gestión', 1, 2, 1, 'Jueves', '18:00', '20:00'),
('2.2.1', 'Desarrollo de Sistemas Web (Back End)', 1, 2, 2, 'Lunes', '18:00', '21:00'),
('2.2.2', 'Desarrollo de Sistemas Web (Front End)', 1, 2, 2, 'Martes', '18:00', '19:00'),
('2.2.3', 'Ingeniería de Software', 1, 2, 2, 'Miércoles', '18:00', '21:00'),
('2.2.4', 'PP III: Desarrollo e Implementación de Sistemas en la Nube', 1, 2, 2, 'Jueves', '18:00', '21:00'),
('3.1.1', 'Programación sobre Redes', 1, 3, 1, 'Lunes', '18:00', '21:00'),
('3.1.2', 'Seminario de Profundización y Actualización', 1, 3, 1, 'Martes', '18:00', '19:00'),
('3.1.3', 'Gestión de Proyectos', 1, 3, 1, 'Martes', '19:00', '21:00'),
('3.1.4', 'Trabajo, Tecnología y Sociedad', 1, 3, 1, 'Miércoles', '18:00', '19:00'),
('3.1.5', 'PP IV: Proyecto Integrador', 1, 3, 1, 'Jueves', '18:00', '21:00');

INSERT INTO correlativas (materia_id, materia_requerida_id)
SELECT m.id, r.id
FROM (
  SELECT '1.2.1' materia, '1.1.1' requiere UNION ALL
  SELECT '1.2.1', '1.1.2' UNION ALL
  SELECT '1.2.1', '1.1.4' UNION ALL
  SELECT '1.2.2', '1.1.1' UNION ALL
  SELECT '2.1.1', '1.2.1' UNION ALL
  SELECT '2.1.1', '1.2.2' UNION ALL
  SELECT '2.1.2', '1.1.1' UNION ALL
  SELECT '2.1.5', '1.2.1' UNION ALL
  SELECT '2.1.5', '1.2.2' UNION ALL
  SELECT '2.1.5', '1.2.5' UNION ALL
  SELECT '2.2.1', '2.1.1' UNION ALL
  SELECT '2.2.1', '2.1.2' UNION ALL
  SELECT '2.2.1', '2.1.3' UNION ALL
  SELECT '2.2.2', '1.2.2' UNION ALL
  SELECT '2.2.4', '2.1.1' UNION ALL
  SELECT '2.2.4', '2.1.3' UNION ALL
  SELECT '2.2.4', '2.1.5' UNION ALL
  SELECT '3.1.1', '2.2.1' UNION ALL
  SELECT '3.1.1', '2.2.3' UNION ALL
  SELECT '3.1.2', '2.2.3' UNION ALL
  SELECT '3.1.3', '2.2.3' UNION ALL
  SELECT '3.1.5', '2.2.4'
) c
JOIN materias m ON m.codigo = c.materia
JOIN materias r ON r.codigo = c.requiere;

INSERT INTO mesas_finales (materia_id, fecha, hora)
SELECT id, DATE_ADD('2026-12-01', INTERVAL (anio - 1) * 3 + cuatrimestre DAY), '18:00'
FROM materias WHERE carrera_id = 1;

INSERT INTO mesas_finales (materia_id, fecha, hora)
SELECT id, DATE_ADD('2026-07-20', INTERVAL (anio - 1) * 3 + cuatrimestre DAY), '18:00'
FROM materias WHERE carrera_id = 1;
