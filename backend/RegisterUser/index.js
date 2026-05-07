const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getPool, sql } = require("../shared/sqldb");
const { signToken } = require("../shared/auth");
const { ok, created, badRequest, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            context.res = badRequest("name, email and password are required");
            return;
        }
        if (password.length < 6) {
            context.res = badRequest("Password must be at least 6 characters");
            return;
        }

        const pool = await getPool();

        // Check if email is already taken
        const existing = await pool.request()
            .input("email", sql.VarChar(255), email)
            .query("SELECT userId FROM Users WHERE email = @email");

        if (existing.recordset.length > 0) {
            context.res = badRequest("Email already registered");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await pool.request()
            .input("userId", sql.VarChar(36), userId)
            .input("name", sql.VarChar(100), name)
            .input("email", sql.VarChar(255), email)
            .input("passwordHash", sql.VarChar(255), passwordHash)
            .query(`
                INSERT INTO Users (userId, name, email, passwordHash, createdDate)
                VALUES (@userId, @name, @email, @passwordHash, GETDATE())
            `);

        const token = signToken({ userId, email, name });

        context.res = created({
            message: "User registered successfully",
            user: { userId, name, email },
            token
        });
    } catch (err) {
        context.log.error("RegisterUser error:", err);
        context.res = serverError(err);
    }
};
