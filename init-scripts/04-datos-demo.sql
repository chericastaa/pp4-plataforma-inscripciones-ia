SET NAMES utf8mb4;

SET @pass = '$2b$10$shmBfa2T2yLhQaWH5niXaeWujkOx2LC9j8qshdXHMEsROKYjguqKS';

INSERT INTO users_db.usuarios (nombre, email, password, rol, dni, carrera_id) VALUES
('Laura Gómez', 'laura@test.com', @pass, 'profesor', '28111222', 1),
('Martín Pereyra', 'martin@test.com', @pass, 'profesor', '30222333', 1),
('Sofía Ruiz', 'sofia@test.com', @pass, 'profesor', '32333444', 1),
('Tomás Álvarez', 'tomas@test.com', @pass, 'alumno', '44333444', 1),
('Juan Pérez', 'juan@test.com', @pass, 'alumno', '44111222', 1),
('Valentina Díaz', 'valentina@test.com', @pass, 'alumno', '44444555', 1),
('Lucía Fernández', 'lucia@test.com', @pass, 'alumno', '44222333', 1);

USE academic_db;

UPDATE materias m JOIN users_db.usuarios u ON u.email = 'laura@test.com'
SET m.profesor_id = u.id WHERE m.codigo IN ('1.1.1', '1.2.1', '2.2.1', '3.1.1');
UPDATE materias m JOIN users_db.usuarios u ON u.email = 'martin@test.com'
SET m.profesor_id = u.id WHERE m.codigo IN ('1.1.2', '1.2.2', '2.2.3', '3.1.3');
UPDATE materias m JOIN users_db.usuarios u ON u.email = 'sofia@test.com'
SET m.profesor_id = u.id WHERE m.codigo IN ('1.1.4', '2.1.2', '3.1.2', '3.1.5');

CREATE TEMPORARY TABLE historial (email varchar(100), codigo varchar(10), p1 decimal(4,2), p2 decimal(4,2));

INSERT INTO historial VALUES
('juan@test.com', '1.1.1', 8, 9),
('juan@test.com', '1.1.2', 5, 6),
('juan@test.com', '1.1.3', 7, 7),
('juan@test.com', '1.1.4', 3, 5),

('valentina@test.com', '1.1.1', 9, 8),
('valentina@test.com', '1.1.2', 7, 8),
('valentina@test.com', '1.1.3', 6, 5),
('valentina@test.com', '1.1.4', 8, 7),
('valentina@test.com', '1.2.1', 7, 9),
('valentina@test.com', '1.2.2', 5, 5),
('valentina@test.com', '1.2.3', 7, 8),
('valentina@test.com', '1.2.4', 9, 9),
('valentina@test.com', '1.2.5', 8, 8),
('valentina@test.com', '2.1.2', NULL, NULL),
('valentina@test.com', '2.1.3', NULL, NULL),

('lucia@test.com', '1.1.1', 9, 9),
('lucia@test.com', '1.1.2', 8, 7),
('lucia@test.com', '1.1.3', 7, 8),
('lucia@test.com', '1.1.4', 7, 7),
('lucia@test.com', '1.2.1', 8, 8),
('lucia@test.com', '1.2.2', 9, 7),
('lucia@test.com', '1.2.3', 7, 7),
('lucia@test.com', '1.2.4', 10, 9),
('lucia@test.com', '1.2.5', 8, 9),
('lucia@test.com', '2.1.1', 8, 7),
('lucia@test.com', '2.1.2', 5, 6),
('lucia@test.com', '2.1.3', 9, 8),
('lucia@test.com', '2.1.4', 8, 8),
('lucia@test.com', '2.1.5', 7, 8),
('lucia@test.com', '2.2.1', 9, 7),
('lucia@test.com', '2.2.2', 8, 8),
('lucia@test.com', '2.2.3', 6, 5),
('lucia@test.com', '2.2.4', 7, 7),
('lucia@test.com', '3.1.1', NULL, NULL),
('lucia@test.com', '3.1.4', NULL, NULL);

INSERT INTO inscripciones (user_id, materia_id)
SELECT u.id, m.id FROM historial h
JOIN users_db.usuarios u ON u.email = h.email
JOIN materias m ON m.codigo = h.codigo;

INSERT INTO calificaciones (user_id, materia_id, parcial1, parcial2, nota)
SELECT u.id, m.id, h.p1, h.p2, (h.p1 + h.p2) / 2 FROM historial h
JOIN users_db.usuarios u ON u.email = h.email
JOIN materias m ON m.codigo = h.codigo
WHERE h.p1 IS NOT NULL;

INSERT INTO inscripciones_finales (mesa_id, user_id, nota)
SELECT mf.id, u.id, f.nota FROM (
  SELECT 'valentina@test.com' email, '1.1.3' codigo, 6 nota UNION ALL
  SELECT 'lucia@test.com', '2.1.2', 8
) f
JOIN users_db.usuarios u ON u.email = f.email
JOIN materias m ON m.codigo = f.codigo
JOIN mesas_finales mf ON mf.materia_id = m.id AND mf.fecha < '2026-10-01';

DROP TEMPORARY TABLE historial;
