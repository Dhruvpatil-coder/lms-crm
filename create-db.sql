-- Run this in pgAdmin or psql to create the database and user
-- Then run: cd backend && npx prisma db push

CREATE DATABASE lms_crm;
CREATE USER lms_user WITH PASSWORD 'lms123';
GRANT ALL PRIVILEGES ON DATABASE lms_crm TO lms_user;
ALTER USER lms_user CREATEDB;
GRANT ALL ON SCHEMA public TO lms_user;
ALTER DATABASE lms_crm OWNER TO lms_user;
