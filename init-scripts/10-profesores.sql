SET NAMES utf8mb4;

INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Ricardo Paz', 'ricardo@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'ricardo@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Patricia Gómez', 'patricia@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'patricia@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Diego Navarro', 'diego@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'diego@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Mariana Ruiz', 'mariana@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'mariana@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Gustavo Ledesma', 'gustavo@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'gustavo@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Silvia Romero', 'silvia@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'silvia@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Andrés Molina', 'andres@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'andres@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Verónica Sosa', 'veronica@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'veronica@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Pablo Herrera', 'pablo@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'pablo@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Natalia Vega', 'natalia@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'natalia@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Fernando Ibáñez', 'fernando@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'fernando@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Claudia Medina', 'claudia@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'claudia@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Sebastián Rojas', 'sebastian@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'sebastian@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Lorena Castro', 'lorena@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'lorena@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Matías Ortiz', 'matias@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'matias@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Gabriela Luna', 'gabriela@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'gabriela@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Julián Bravo', 'julian@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'julian@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Romina Peralta', 'romina@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'romina@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Esteban Cruz', 'esteban@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'esteban@test.com');

UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 2 AND codigo = '2.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 2 AND codigo = '2.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 2 AND codigo = '1.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 1 AND codigo = '2.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 1 AND codigo = '1.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 2 AND codigo = '2.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 1 AND codigo = '3.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '3.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 1 AND codigo = '2.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 1 AND codigo = '1.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 2 AND codigo = '2.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 2 AND codigo = '1.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'ricardo@test.com') WHERE carrera_id = 2 AND codigo = '2.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'ricardo@test.com') WHERE carrera_id = 1 AND codigo = '3.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'patricia@test.com') WHERE carrera_id = 1 AND codigo = '2.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'patricia@test.com') WHERE carrera_id = 1 AND codigo = '3.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'diego@test.com') WHERE carrera_id = 1 AND codigo = '1.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'diego@test.com') WHERE carrera_id = 2 AND codigo = '2.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'mariana@test.com') WHERE carrera_id = 1 AND codigo = '1.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'mariana@test.com') WHERE carrera_id = 2 AND codigo = '3.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'gustavo@test.com') WHERE carrera_id = 1 AND codigo = '2.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'gustavo@test.com') WHERE carrera_id = 2 AND codigo = '2.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'silvia@test.com') WHERE carrera_id = 1 AND codigo = '1.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'silvia@test.com') WHERE carrera_id = 1 AND codigo = '2.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'andres@test.com') WHERE carrera_id = 1 AND codigo = '3.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'andres@test.com') WHERE carrera_id = 1 AND codigo = '2.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'veronica@test.com') WHERE carrera_id = 1 AND codigo = '2.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'veronica@test.com') WHERE carrera_id = 2 AND codigo = '3.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'pablo@test.com') WHERE carrera_id = 1 AND codigo = '1.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'pablo@test.com') WHERE carrera_id = 1 AND codigo = '1.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'natalia@test.com') WHERE carrera_id = 2 AND codigo = '2.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'natalia@test.com') WHERE carrera_id = 1 AND codigo = '2.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'fernando@test.com') WHERE carrera_id = 1 AND codigo = '2.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'fernando@test.com') WHERE carrera_id = 2 AND codigo = '1.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'claudia@test.com') WHERE carrera_id = 2 AND codigo = '2.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'claudia@test.com') WHERE carrera_id = 1 AND codigo = '3.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sebastian@test.com') WHERE carrera_id = 2 AND codigo = '3.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sebastian@test.com') WHERE carrera_id = 2 AND codigo = '1.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'lorena@test.com') WHERE carrera_id = 2 AND codigo = '2.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'lorena@test.com') WHERE carrera_id = 2 AND codigo = '3.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'matias@test.com') WHERE carrera_id = 2 AND codigo = '1.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'matias@test.com') WHERE carrera_id = 2 AND codigo = '1.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'gabriela@test.com') WHERE carrera_id = 2 AND codigo = '1.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'gabriela@test.com') WHERE carrera_id = 2 AND codigo = '1.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julian@test.com') WHERE carrera_id = 1 AND codigo = '1.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'romina@test.com') WHERE carrera_id = 2 AND codigo = '1.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'esteban@test.com') WHERE carrera_id = 1 AND codigo = '1.2.4';
