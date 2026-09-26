USE users_db;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol` enum('alumno','profesor','admin') DEFAULT NULL,
  `dni` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Usuario admin creado automáticamente (email: admin@test.com / contraseña: admin123)
INSERT INTO `usuarios` (`nombre`, `email`, `password`, `rol`, `dni`)
VALUES ('Admin', 'admin@test.com', '$2b$10$shmBfa2T2yLhQaWH5niXaeWujkOx2LC9j8qshdXHMEsROKYjguqKS', 'admin', NULL);