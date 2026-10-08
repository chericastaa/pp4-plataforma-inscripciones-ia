SET NAMES utf8mb4;

USE academic_db;

UPDATE carreras SET nombre = 'Tecnicatura Superior en Análisis de Sistemas' WHERE id = 2;

INSERT INTO materias (codigo, nombre, carrera_id, anio, cuatrimestre, dia, hora_inicio, hora_fin) VALUES
('1.1.1', 'Técnicas de Programación', 2, 1, 1, 'Lunes', '18:00', '21:00'),
('1.1.2', 'Elementos de Análisis Matemático', 2, 1, 1, 'Martes', '18:00', '20:00'),
('1.1.3', 'Administración y Gestión de Base de Datos', 2, 1, 1, 'Miércoles', '18:00', '21:00'),
('1.1.4', 'Lógica Computacional', 2, 1, 1, 'Jueves', '18:00', '20:00'),
('1.2.1', 'Desarrollo de Sistemas Orientado a Objetos', 2, 1, 2, 'Lunes', '18:00', '20:00'),
('1.2.2', 'Estadística y Probabilidades para el Análisis de Sistemas', 2, 1, 2, 'Martes', '18:00', '20:00'),
('1.2.3', 'Modelado y Diseño de Software', 2, 1, 2, 'Miércoles', '18:00', '20:00'),
('1.2.4', 'Inglés', 2, 1, 2, 'Jueves', '18:00', '20:00'),
('1.2.5', 'PP I: Aproximación al Campo Laboral', 2, 1, 2, 'Viernes', '18:00', '21:00'),
('2.1.1', 'Análisis de Sistemas', 2, 2, 1, 'Lunes', '18:00', '20:00'),
('2.1.2', 'Ingeniería de Software', 2, 2, 1, 'Martes', '18:00', '20:00'),
('2.1.3', 'Taller de Comunicación', 2, 2, 1, 'Miércoles', '18:00', '20:00'),
('2.1.4', 'Diseño e Implementación de Pruebas de Software', 2, 2, 1, 'Jueves', '18:00', '20:00'),
('2.1.5', 'PP II: Relevamiento de Requerimientos de Usuario', 2, 2, 1, 'Viernes', '18:00', '21:00'),
('2.2.1', 'Trabajo, Tecnología y Sociedad', 2, 2, 2, 'Lunes', '18:00', '19:00'),
('2.2.2', 'Redes y Ciberseguridad', 2, 2, 2, 'Martes', '18:00', '21:00'),
('2.2.3', 'Gestión de Proyectos', 2, 2, 2, 'Miércoles', '18:00', '20:00'),
('2.2.4', 'Seminario de Actualización en Tecnología Web', 2, 2, 2, 'Jueves', '18:00', '20:00'),
('2.2.5', 'PP III: Diseño y Arquitectura de Sistemas', 2, 2, 2, 'Viernes', '18:00', '21:00'),
('3.1.1', 'Sistemas de Gestión', 2, 3, 1, 'Lunes', '18:00', '20:00'),
('3.1.2', 'Liderazgo y Gestión de Equipos', 2, 3, 1, 'Martes', '18:00', '20:00'),
('3.1.3', 'Aseguramiento de Calidad de los Sistemas', 2, 3, 1, 'Miércoles', '18:00', '19:00'),
('3.1.4', 'Arquitectura de Sistemas en la Nube', 2, 3, 1, 'Jueves', '18:00', '20:00'),
('3.1.5', 'PP IV: Proyecto Integrador', 2, 3, 1, 'Viernes', '18:00', '21:00');

INSERT INTO correlativas (materia_id, materia_requerida_id)
SELECT m.id, r.id
FROM (
  SELECT '1.2.1' materia, '1.1.1' requiere UNION ALL
  SELECT '1.2.1', '1.1.3' UNION ALL
  SELECT '1.2.1', '1.1.4' UNION ALL
  SELECT '1.2.3', '1.1.1' UNION ALL
  SELECT '2.1.4', '1.2.1' UNION ALL
  SELECT '2.2.4', '1.2.1' UNION ALL
  SELECT '3.1.1', '1.1.3' UNION ALL
  SELECT '3.1.2', '2.1.1' UNION ALL
  SELECT '3.1.2', '2.1.2' UNION ALL
  SELECT '3.1.3', '2.1.4' UNION ALL
  SELECT '3.1.4', '2.2.2' UNION ALL
  SELECT '3.1.5', '2.1.5' UNION ALL
  SELECT '3.1.5', '2.2.5'
) c
JOIN materias m ON m.codigo = c.materia AND m.carrera_id = 2
JOIN materias r ON r.codigo = c.requiere AND r.carrera_id = 2;

INSERT INTO mesas_finales (materia_id, fecha, hora)
SELECT id, DATE_ADD('2026-12-01', INTERVAL (anio - 1) * 3 + cuatrimestre DAY), '18:00'
FROM materias WHERE carrera_id = 2;

INSERT INTO mesas_finales (materia_id, fecha, hora)
SELECT id, DATE_ADD('2026-07-20', INTERVAL (anio - 1) * 3 + cuatrimestre DAY), '18:00'
FROM materias WHERE carrera_id = 2;

SET @pass = '$2b$10$shmBfa2T2yLhQaWH5niXaeWujkOx2LC9j8qshdXHMEsROKYjguqKS';

INSERT INTO users_db.usuarios (nombre, email, password, rol, dni, carrera_id) VALUES
('Agustina Romero', 'agustina@test.com', @pass, 'alumno', '44555666', 2),
('Nicolás Benítez', 'nicolas@test.com', @pass, 'alumno', '44666777', 2);

UPDATE materias m JOIN users_db.usuarios u ON u.email = 'laura@test.com'
SET m.profesor_id = u.id WHERE m.carrera_id = 2 AND m.codigo IN ('1.1.1', '1.2.1', '2.1.1', '3.1.1');
UPDATE materias m JOIN users_db.usuarios u ON u.email = 'martin@test.com'
SET m.profesor_id = u.id WHERE m.carrera_id = 2 AND m.codigo IN ('1.1.3', '1.2.3', '2.1.2', '3.1.2');
UPDATE materias m JOIN users_db.usuarios u ON u.email = 'sofia@test.com'
SET m.profesor_id = u.id WHERE m.carrera_id = 2 AND m.codigo IN ('1.1.4', '2.1.4', '2.2.2', '3.1.5');

CREATE TEMPORARY TABLE historial (email varchar(100), codigo varchar(10), p1 decimal(4,2), p2 decimal(4,2));

INSERT INTO historial VALUES
('agustina@test.com', '1.1.1', 9, 8),
('agustina@test.com', '1.1.2', 6, 5),
('agustina@test.com', '1.1.3', 8, 8),
('agustina@test.com', '1.1.4', 7, 7),
('agustina@test.com', '1.2.1', 7, 8),
('agustina@test.com', '1.2.2', 5, 6),
('agustina@test.com', '1.2.3', 8, 7),
('agustina@test.com', '1.2.4', 3, 5),
('agustina@test.com', '1.2.5', 8, 9),
('agustina@test.com', '2.1.1', NULL, NULL),
('agustina@test.com', '2.1.3', NULL, NULL),

('nicolas@test.com', '1.1.1', 8, 7),
('nicolas@test.com', '1.1.2', 4, 4),
('nicolas@test.com', '1.1.3', 6, 5),
('nicolas@test.com', '1.1.4', 7, 8),
('nicolas@test.com', '1.2.1', NULL, NULL),
('nicolas@test.com', '1.2.3', NULL, NULL);

INSERT INTO inscripciones (user_id, materia_id)
SELECT u.id, m.id FROM historial h
JOIN users_db.usuarios u ON u.email = h.email
JOIN materias m ON m.codigo = h.codigo AND m.carrera_id = 2;

INSERT INTO calificaciones (user_id, materia_id, parcial1, parcial2, nota)
SELECT u.id, m.id, h.p1, h.p2, (h.p1 + h.p2) / 2 FROM historial h
JOIN users_db.usuarios u ON u.email = h.email
JOIN materias m ON m.codigo = h.codigo AND m.carrera_id = 2
WHERE h.p1 IS NOT NULL;

INSERT INTO inscripciones_finales (mesa_id, user_id, nota)
SELECT mf.id, u.id, f.nota FROM (
  SELECT 'agustina@test.com' email, '1.1.2' codigo, 7 nota UNION ALL
  SELECT 'agustina@test.com', '1.2.2', 6
) f
JOIN users_db.usuarios u ON u.email = f.email
JOIN materias m ON m.codigo = f.codigo AND m.carrera_id = 2
JOIN mesas_finales mf ON mf.materia_id = m.id AND mf.fecha < '2026-10-01';

DROP TEMPORARY TABLE historial;
