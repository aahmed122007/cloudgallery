const { getPool, sql } = require("../shared/sqldb");
const { authenticate } = require("../shared/auth");
const { ok, badRequest, unauthorized, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const user = authenticate(req);
        if (!user) { context.res = unauthorized(); return; }

        const userId = context.bindingData.id;
        if (user.userId !== userId) {
            context.res = unauthorized("You can only update your own profile");
            return;
        }

        const { name } = req.body || {};
        if (!name) { context.res = badRequest("name is required"); return; }

        const pool = await getPool();
        const result = await pool.request()
            .input("userId", sql.VarChar(36), userId)
            .input("name", sql.VarChar(100), name)
            .query("UPDATE Users SET name = @name WHERE userId = @userId; SELECT @@ROWCOUNT AS rows");

        if (result.recordset[0].rows === 0) {
            context.res = notFound("User not found");
            return;
        }
        context.res = ok({ message: "User updated", userId, name });
    } catch (err) {
        context.log.error("UpdateUser error:", err);
        context.res = serverError(err);
    }
};
