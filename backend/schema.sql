-- Execute this file in your PostgreSQL client (pgAdmin, psql, DBeaver) 
-- Ensure you have connected to your 'employeedb' database first.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('employee', 'intern')),
    title VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    employee_code_link TEXT,
    offer_letter_status VARCHAR(50) DEFAULT 'PENDING' CHECK (offer_letter_status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offer_letters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    link TEXT NULL, -- Nullable because the cloud upload happens asynchronously after row creation
    offer_letter_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
