DO $$ BEGIN
    CREATE ROLE authentico_user;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Role authentico_user already exists, skipping.';
END $$;

ALTER ROLE authentico_user WITH PASSWORD 'password';
<<<<<<< HEAD
CREATE DATABASE authentico_users OWNER authentico_user;
=======
CREATE DATABASE authentico_users OWNER authentico_user;
>>>>>>> cf12c2b723c40de76570756c7719230dabd434ba
