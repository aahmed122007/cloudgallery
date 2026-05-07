const { getPool, sql } = require("../shared/sqldb");
const { ok, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const userId = context.bindingData.id;
        const pool = await getPool();
        const result = await pool.request()
            .input("userId", sql.VarChar(36), userId)
            .query("SELECT userId, name, email, createdDate FROM Users WHERE userId = @userId");

        if (result.recordset.length === 0) {
            context.res = notFound("User not found");
            return;
        }
        context.res = ok(result.recordset[0]);
    } catch (err) {
        context.log.error("GetUser error:", err);
        context.res = serverError(err);
    }
};
