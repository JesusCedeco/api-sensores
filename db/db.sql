CREATE DATABASE node;

#para usar base de datos node
USE node;

CREATE TABLE usuarios (
    ID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    password VARCHAR(10) NOT NULL
);

INSERT INTO usuarios (nombre, password) VALUES ('Manolo', '4321')

SELECT * FROM usuarios;

ALTER Table ADD COLUMN email VARCHAR(255) NOT NULL