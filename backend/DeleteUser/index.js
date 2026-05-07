const { getPool, sql } = require("../shared/sqldb");
const { authenticate } = require("../shared/auth");
const { ok, badRequest, unauthorized, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    const userId = context.bindingData.id;

    if (req.method === "GET") {
        try {
            const pool = await getPool();
            const result = await pool.request()
                .input("userId", sql.VarChar(36), userId)
                .query("SELECT userId, name, email, createdDate FROM Users WHERE userId = @userId");

            if (result.recordset.length === 0) { context.res = notFound("User not found"); return; }
            context.res = ok(result.recordset[0]);
        } catch (err) {
            context.log.error("GetUser error:", err);
            context.res = serverError(err);
        }
        return;
    }

    if (req.method === "PUT") {
        try {
            const user = authenticate(req);
            if (!user) { context.res = unauthorized(); return; }
            if (user.userId !== userId) { context.res = unauthorized("You can only update your own profile"); return; }

            const { name } = req.body || {};
            if (!name) { context.res = badRequest("name is required"); return; }

            const pool = await getPool();
            const result = await pool.request()
                .input("userId", sql.VarChar(36), userId)
                .input("name", sql.VarChar(100), name)
                .query("UPDATE Users SET name = @name WHERE userId = @userId; SELECT @@ROWCOUNT AS rows");

            if (result.recordset[0].rows === 0) { context.res = notFound("User not found"); return; }
            context.res = ok({ message: "User updated", userId, name });
        } catch (err) {
            context.log.error("UpdateUser error:", err);
            context.res = serverError(err);
        }
        return;
    }

    if (req.method === "DELETE") {
        try {
            const user = authenticate(req);
            if (!user) { context.res = unauthorized(); return; }
            if (user.userId !== userId) { context.res = unauthorized("You can only delete your own account"); return; }

            const pool = await getPool();
            const result = await pool.request()
                .input("userId", sql.VarChar(36), userId)
                .query("DELETE FROM Users WHERE userId = @userId; SELECT @@ROWCOUNT AS rows");

            if (result.recordset[0].rows === 0) { context.res = notFound("User not found"); return; }
            context.res = ok({ message: "User account deleted" });
        } catch (err) {
            context.log.error("DeleteUser error:", err);
            context.res = serverError(err);
        }
        return;
    }

    context.res = { status: 405, headers: corsHeaders, body: { error: "Method not allowed" } };
};
