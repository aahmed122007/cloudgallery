const { getMediaContainer } = require("../shared/cosmos");
const { deleteBlob } = require("../shared/blob");
const { authenticate } = require("../shared/auth");
const { ok, unauthorized, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const user = authenticate(req);
        if (!user) { context.res = unauthorized(); return; }

        const mediaId = context.bindingData.id;
        const container = getMediaContainer();

        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.mediaId = @id",
            parameters: [{ name: "@id", value: mediaId }]
        }).fetchAll();

        if (resources.length === 0) { context.res = notFound("Media not found"); return; }
        const media = resources[0];

        if (media.userId !== user.userId) {
            context.res = unauthorized("You can only delete your own media");
            return;
        }

        // Remove blob first, then the metadata record
        if (media.blobName) await deleteBlob(media.blobName);
        await container.item(media.id, media.userId).delete();

        context.res = ok({ message: "Media deleted", mediaId });
    } catch (err) {
        context.log.error("DeleteMedia error:", err);
        context.res = serverError(err);
    }
};
