CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
	password VARCHAR(255)
);

INSERT INTO users (email, password) VALUES ('jlopezgab18@gmail.com', 'testingpass')