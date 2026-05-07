const bcrypt = require("bcryptjs");
const { getPool, sql } = require("../shared/sqldb");
const { signToken } = require("../shared/auth");
const { ok, badRequest, unauthorized, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            context.res = badRequest("email and password required");
            return;
        }

        const pool = await getPool();
        const result = await pool.request()
            .input("email", sql.VarChar(255), email)
            .query("SELECT userId, name, email, passwordHash FROM Users WHERE email = @email");

        if (result.recordset.length === 0) {
            context.res = unauthorized("Invalid credentials");
            return;
        }

        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            context.res = unauthorized("Invalid credentials");
            return;
        }

        const token = signToken({
            userId: user.userId,
            email: user.email,
            name: user.name
        });

        context.res = ok({
            message: "Login successful",
            user: { userId: user.userId, name: user.name, email: user.email },
            token
        });
    } catch (err) {
        context.log.error("LoginUser error:", err);
        context.res = serverError(err);
    }
};
