-- Run this script in PostgreSQL to create the database and user
-- You can execute this in pgAdmin's Query Tool or psql command line

-- Create the database (run as postgres superuser)
CREATE DATABASE wnsc_db;

-- Create a user for the application (optional but recommended)
-- CREATE USER wnsc_user WITH PASSWORD 'your_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE wnsc_db TO wnsc_user;

-- Connect to the new database before running migrations
-- \c wnsc_db;