DO $$ BEGIN
    CREATE ROLE authentico_user;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Role authentico_user already exists, skipping.';
END $$;
ALTER ROLE authentico_user WITH PASSWORD 'password';

-- Create the database outside of a transaction block
DO $$ BEGIN
    PERFORM 1 FROM pg_database WHERE datname = 'authentico_users';
    IF NOT FOUND THEN
        EXECUTE 'CREATE DATABASE authentico_users OWNER authentico_user';
    ELSE
        RAISE NOTICE 'Database authentico_users already exists, skipping.';
    END IF;
END $$;