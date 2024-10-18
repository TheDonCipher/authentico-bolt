CREATE USER authentico_user WITH PASSWORD 'password';
CREATE DATABASE authentico_users;
GRANT ALL PRIVILEGES ON DATABASE authentico_users TO authentico_user;
