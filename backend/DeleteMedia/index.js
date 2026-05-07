const { getMediaContainer } = require("../shared/cosmos");
const { deleteBlob } = require("../shared/blob");
const { authenticate } = require("../shared/auth");
const { ok, badRequest, unauthorized, notFound, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    const mediaId = context.bindingData.id;
    const container = getMediaContainer();

    if (req.method === "GET") {
        try {
            const { resources } = await container.items.query({
                query: "SELECT * FROM c WHERE c.mediaId = @id",
                parameters: [{ name: "@id", value: mediaId }]
            }).fetchAll();
            if (resources.length === 0) { context.res = notFound("Media not found"); return; }
            context.res = ok(resources[0]);
        } catch (err) {
            context.log.error("GetMedia error:", err);
            context.res = serverError(err);
        }
        return;
    }

    if (req.method === "PUT") {
        try {
            const user = authenticate(req);
            if (!user) { context.res = unauthorized(); return; }

            const { resources } = await container.items.query({
                query: "SELECT * FROM c WHERE c.mediaId = @id",
                parameters: [{ name: "@id", value: mediaId }]
            }).fetchAll();
            if (resources.length === 0) { context.res = notFound("Media not found"); return; }

            const media = resources[0];
            const { title, description, tags, action, comment } = req.body || {};

            if (title !== undefined || description !== undefined || tags !== undefined) {
                if (media.userId !== user.userId) {
                    context.res = unauthorized("You can only edit your own media");
                    return;
                }
                if (title !== undefined) media.title = title;
                if (description !== undefined) media.description = description;
                if (tags !== undefined) media.tags = Array.isArray(tags) ? tags : [];
            }

            if (action === "toggleLike") {
                media.likedBy = media.likedBy || [];
                const idx = media.likedBy.indexOf(user.userId);
                if (idx >= 0) {
                    media.likedBy.splice(idx, 1);
                    media.likes = Math.max(0, (media.likes || 0) - 1);
                } else {
                    media.likedBy.push(user.userId);
                    media.likes = (media.likes || 0) + 1;
                }
            }

            if (action === "addComment" && comment) {
                media.comments = media.comments || [];
                media.comments.push({
                    user: user.name,
                    userId: user.userId,
                    text: comment,
                    createdAt: new Date().toISOString()
                });
            }

            const { resource: updated } = await container.item(media.id, media.userId).replace(media);
            context.res = ok(updated);
        } catch (err) {
            context.log.error("UpdateMedia error:", err);
            context.res = serverError(err);
        }
        return;
    }

    if (req.method === "DELETE") {
        try {
            const user = authenticate(req);
            if (!user) { context.res = unauthorized(); return; }

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

            if (media.blobName) await deleteBlob(media.blobName);
            await container.item(media.id, media.userId).delete();

            context.res = ok({ message: "Media deleted", mediaId });
        } catch (err) {
            context.log.error("DeleteMedia error:", err);
            context.res = serverError(err);
        }
        return;
    }

    context.res = { status: 405, headers: corsHeaders, body: { error: "Method not allowed" } };
};
