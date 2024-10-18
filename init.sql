DO $$ BEGIN
    CREATE ROLE authentico_user;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Role authentico_user already exists, skipping.';
END $$;

ALTER ROLE authentico_user WITH PASSWORD 'password';
CREATE DATABASE authentico_users OWNER authentico_user;