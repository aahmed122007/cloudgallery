const { getMediaContainer } = require("../shared/cosmos");
const { ok, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const mediaId = context.bindingData.id;
        const container = getMediaContainer();

        // Partition key assumed to be /userId — so we query instead of a point read
        const query = {
            query: "SELECT * FROM c WHERE c.mediaId = @id",
            parameters: [{ name: "@id", value: mediaId }]
        };
        const { resources } = await container.items.query(query).fetchAll();

        if (resources.length === 0) {
            context.res = notFound("Media not found");
            return;
        }
        context.res = ok(resources[0]);
    } catch (err) {
        context.log.error("GetMedia error:", err);
        context.res = serverError(err);
    }
};
