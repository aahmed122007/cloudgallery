const { getMediaContainer } = require("../shared/cosmos");
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

        const mediaId = context.bindingData.id;
        const container = getMediaContainer();

        const query = {
            query: "SELECT * FROM c WHERE c.mediaId = @id",
            parameters: [{ name: "@id", value: mediaId }]
        };
        const { resources } = await container.items.query(query).fetchAll();
        if (resources.length === 0) { context.res = notFound("Media not found"); return; }

        const media = resources[0];
        const { title, description, tags, action, comment } = req.body || {};

        // --- Owner-only updates ---
        if (title !== undefined || description !== undefined || tags !== undefined) {
            if (media.userId !== user.userId) {
                context.res = unauthorized("You can only edit your own media");
                return;
            }
            if (title !== undefined) media.title = title;
            if (description !== undefined) media.description = description;
            if (tags !== undefined) media.tags = Array.isArray(tags) ? tags : [];
        }

        // --- Like toggle (any logged-in user) ---
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

        // --- Add comment ---
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
};
