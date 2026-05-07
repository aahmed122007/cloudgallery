const { getMediaContainer } = require("../shared/cosmos");
const { ok, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const userId = req.query.userId;
        const limit = parseInt(req.query.limit) || 50;

        const container = getMediaContainer();
        let querySpec;
        if (userId) {
            querySpec = {
                query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.uploadTime DESC OFFSET 0 LIMIT @limit",
                parameters: [
                    { name: "@userId", value: userId },
                    { name: "@limit", value: limit }
                ]
            };
        } else {
            querySpec = {
                query: "SELECT * FROM c ORDER BY c.uploadTime DESC OFFSET 0 LIMIT @limit",
                parameters: [{ name: "@limit", value: limit }]
            };
        }

        const { resources } = await container.items.query(querySpec).fetchAll();
        context.res = ok({ count: resources.length, items: resources });
    } catch (err) {
        context.log.error("ListMedia error:", err);
        context.res = serverError(err);
    }
};
