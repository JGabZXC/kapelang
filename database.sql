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

CREATE TABLE orders(
    id SERIAL PRIMARY KEY,
    order_id INT,
    item_name VARCHAR(255),
    quantity INT,
    price INT,
    total_price INT,
    placed_by_id INT REFERENCES users(id),
    placed_by_name VARCHAR (255),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR (255) DEFAULT 'Pending',
    served_by VARCHAR (255) DEFAULT 'Admin'
)

INSERT INTO orders (order_id, item_name, quantity, price, total_price, placed_by_id, placed_by_name) VALUES (1, 'Baguette', 1, 25, 25, 22, 'John Lopez')
INSERT INTO orders (order_id, item_name, quantity, price, total_price, placed_by_id, placed_by_name) VALUES (1, 'Latte', 1, 50, 50, 22, 'John Lopez')