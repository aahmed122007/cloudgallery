const { getMediaContainer } = require("../shared/cosmos");
const { ok, badRequest, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const tag = (req.query.tag || "").toLowerCase().trim();
        const text = (req.query.q || "").toLowerCase().trim();

        if (!tag && !text) {
            context.res = badRequest("Provide at least one of: tag, q");
            return;
        }

        const container = getMediaContainer();
        // Search across user tags AND AI tags, OR title/description
        const querySpec = {
            query: `SELECT * FROM c
                    WHERE (@tag != '' AND (ARRAY_CONTAINS(c.tags, @tag) OR ARRAY_CONTAINS(c.aiTags, @tag)))
                       OR (@text != '' AND (CONTAINS(LOWER(c.title), @text) OR CONTAINS(LOWER(c.description), @text)))
                    ORDER BY c.uploadTime DESC`,
            parameters: [
                { name: "@tag", value: tag },
                { name: "@text", value: text }
            ]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();
        context.res = ok({ count: resources.length, items: resources });
    } catch (err) {
        context.log.error("SearchMedia error:", err);
        context.res = serverError(err);
    }
};
