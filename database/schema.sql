-- =========================================================================
-- CloudGallery — Azure SQL Database Schema
-- =========================================================================
-- Run this script once against your Azure SQL Database after creation.
-- Use SSMS, Azure Data Studio, or the Azure portal Query Editor.
-- =========================================================================

-- -------- Users table (relational) --------
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        userId        VARCHAR(36)  NOT NULL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        passwordHash  VARCHAR(255) NOT NULL,
        createdDate   DATETIME     NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_Users_Email ON dbo.Users(email);
END;
GO

-- -------- (Optional) Albums table --------
-- Mirrors the ERD in CW1; kept for future expansion.
IF OBJECT_ID('dbo.Albums', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Albums (
        albumId     VARCHAR(36) NOT NULL PRIMARY KEY,
        title       VARCHAR(200) NOT NULL,
        description VARCHAR(1000) NULL,
        createdBy   VARCHAR(36) NOT NULL,
        createdAt   DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Albums_Users FOREIGN KEY (createdBy) REFERENCES dbo.Users(userId)
    );
END;
GO

-- -------- Seed a demo user (optional, for testing) --------
-- The quickest way to get a test account is to simply register through the app UI.
-- If you want a SQL-seeded account instead, generate the bcrypt hash first:
--
--   cd backend
--   node -e "const b=require('bcryptjs');b.hash('Demo1234',10).then(h=>console.log(h))"
--
-- Then uncomment and run the block below, replacing <HASH> with the output.
--
-- IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = 'demo@cloudgallery.com')
-- BEGIN
--     INSERT INTO dbo.Users (userId, name, email, passwordHash, createdDate)
--     VALUES (
--         '00000000-0000-0000-0000-000000000001',
--         'Demo User',
--         'demo@cloudgallery.com',
--         '<HASH>',
--         GETDATE()
--     );
-- END;

PRINT 'CloudGallery schema applied successfully.';
