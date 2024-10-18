CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
	password VARCHAR(255)
);

ALTER TABLE users
ADD full_name VARCHAR(255),
ADD address VARCHAR(255);

ALTER TABLE users ADD is_admin boolean;

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255),
    price FLOAT,
    type VARCHAR(255),
    total_order INT
)