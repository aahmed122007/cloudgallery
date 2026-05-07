const { v4: uuidv4 } = require("uuid");
const multipart = require("parse-multipart-data");
const { uploadBlob } = require("../shared/blob");
const { getMediaContainer } = require("../shared/cosmos");
const { authenticate } = require("../shared/auth");
const { ok, created, badRequest, unauthorized, serverError, corsHeaders } = require("../shared/response");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    if (req.method === "GET") {
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
        return;
    }

    if (req.method === "POST") {
        try {
            const user = authenticate(req);
            if (!user) { context.res = unauthorized(); return; }

            const contentType = req.headers["content-type"] || req.headers["Content-Type"];
            if (!contentType || !contentType.includes("multipart/form-data")) {
                context.res = badRequest("Content-Type must be multipart/form-data");
                return;
            }

            const boundary = multipart.getBoundary(contentType);
            const parts = multipart.parse(req.body, boundary);

            let fileBuffer = null, fileName = null, fileType = null;
            let title = "", description = "", tags = [];

            for (const part of parts) {
                if (part.filename) {
                    fileBuffer = part.data;
                    fileName = part.filename;
                    fileType = part.type || "application/octet-stream";
                } else if (part.name === "title") {
                    title = part.data.toString();
                } else if (part.name === "description") {
                    description = part.data.toString();
                } else if (part.name === "tags") {
                    tags = part.data.toString().split(",").map(t => t.trim()).filter(Boolean);
                }
            }

            if (!fileBuffer) { context.res = badRequest("No file uploaded"); return; }
            if (!title) { context.res = badRequest("title is required"); return; }

            const mediaId = uuidv4();
            const ext = fileName.split(".").pop();
            const blobName = `${user.userId}/${mediaId}.${ext}`;
            const blobUrl = await uploadBlob(fileBuffer, blobName, fileType);

            const mediaRecord = {
                id: mediaId,
                mediaId,
                userId: user.userId,
                userName: user.name,
                title,
                description,
                type: fileType.startsWith("video") ? "video" : "image",
                blobName,
                blobUrl,
                tags,
                aiTags: [],
                likes: 0,
                likedBy: [],
                comments: [],
                uploadTime: new Date().toISOString()
            };

            const container = getMediaContainer();
            await container.items.create(mediaRecord);

            context.res = created({ message: "Upload successful", media: mediaRecord });
        } catch (err) {
            context.log.error("UploadMedia error:", err);
            context.res = serverError(err);
        }
        return;
    }

    context.res = { status: 405, headers: corsHeaders, body: { error: "Method not allowed" } };
};
