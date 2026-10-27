SET NAMES utf8mb4;

INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Carolina Ferrari', 'carolina@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'carolina@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Hernán Acosta', 'hernan@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'hernan@test.com');
INSERT INTO users_db.usuarios (nombre, email, password, rol)
SELECT 'Julieta Benítez', 'julieta@test.com', (SELECT password FROM users_db.usuarios WHERE email = 'laura@test.com'), 'profesor'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users_db.usuarios WHERE email = 'julieta@test.com');

UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 1 AND codigo = '1.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 1 AND codigo = '1.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 1 AND codigo = '1.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 1 AND codigo = '1.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 1 AND codigo = '2.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 1 AND codigo = '2.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 1 AND codigo = '2.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 1 AND codigo = '2.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 1 AND codigo = '2.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 1 AND codigo = '2.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 1 AND codigo = '2.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 1 AND codigo = '3.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 1 AND codigo = '3.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 1 AND codigo = '3.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 1 AND codigo = '3.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 1 AND codigo = '3.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 2 AND codigo = '1.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 2 AND codigo = '1.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 2 AND codigo = '1.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 2 AND codigo = '1.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 2 AND codigo = '1.2.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 2 AND codigo = '1.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '1.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 2 AND codigo = '1.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '2.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '2.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '2.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'carolina@test.com') WHERE carrera_id = 2 AND codigo = '2.1.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 2 AND codigo = '2.1.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'julieta@test.com') WHERE carrera_id = 2 AND codigo = '2.2.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'laura@test.com') WHERE carrera_id = 2 AND codigo = '2.2.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 2 AND codigo = '2.2.4';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'martin@test.com') WHERE carrera_id = 2 AND codigo = '2.2.5';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 2 AND codigo = '3.1.1';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 2 AND codigo = '3.1.2';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'sofia@test.com') WHERE carrera_id = 2 AND codigo = '3.1.3';
UPDATE academic_db.materias SET profesor_id = (SELECT id FROM users_db.usuarios WHERE email = 'hernan@test.com') WHERE carrera_id = 2 AND codigo = '3.1.4';
