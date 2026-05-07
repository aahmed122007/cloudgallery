/**
 * Event-driven Azure Function:
 *   - Fires every time a new blob lands in the media container.
 *   - Calls Azure AI Vision to tag the image.
 *   - Calls Azure AI Content Safety to flag inappropriate content.
 *   - Updates the Cosmos DB metadata record with aiTags + safety verdict.
 *
 * This implements two advanced features from the CW1 design:
 *   (1) Azure AI Vision (auto-tagging)
 *   (2) Azure AI Content Safety (moderation)
 */

const { getMediaContainer } = require("../shared/cosmos");

async function analyzeWithVision(imageUrl) {
    const endpoint = process.env.COMPUTER_VISION_ENDPOINT;
    const key = process.env.COMPUTER_VISION_KEY;
    if (!endpoint || !key) return { tags: [] };

    const url = `${endpoint.replace(/\/$/, "")}/vision/v3.2/analyze?visualFeatures=Tags,Description`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: imageUrl })
    });
    if (!response.ok) throw new Error(`Vision API error: ${response.status}`);
    const data = await response.json();
    const tags = (data.tags || [])
        .filter(t => t.confidence >= 0.7)
        .map(t => t.name.toLowerCase());
    return { tags };
}

async function checkContentSafety(imageUrl) {
    const endpoint = process.env.CONTENT_SAFETY_ENDPOINT;
    const key = process.env.CONTENT_SAFETY_KEY;
    if (!endpoint || !key) return { flagged: false };

    try {
        // Fetch the image bytes and forward as base64 per Content Safety API
        const imgResp = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgResp.arrayBuffer());
        const imageBase64 = imgBuffer.toString("base64");

        const url = `${endpoint.replace(/\/$/, "")}/contentsafety/image:analyze?api-version=2023-10-01`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: { content: imageBase64 } })
        });
        if (!response.ok) return { flagged: false };
        const data = await response.json();
        // Flag if any category severity >= 4 (moderate and above)
        const flagged = (data.categoriesAnalysis || []).some(c => c.severity >= 4);
        return { flagged, details: data.categoriesAnalysis };
    } catch {
        return { flagged: false };
    }
}

module.exports = async function (context, blob) {
    const { userId, mediaFile } = context.bindingData;
    const blobUrl = `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/media/${userId}/${mediaFile}`;

    context.log(`Analyzing blob: ${userId}/${mediaFile}`);

    try {
        const [vision, safety] = await Promise.all([
            analyzeWithVision(blobUrl),
            checkContentSafety(blobUrl)
        ]);

        // Look up the matching media record by blobName and patch it
        const blobName = `${userId}/${mediaFile}`;
        const container = getMediaContainer();
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.blobName = @name",
            parameters: [{ name: "@name", value: blobName }]
        }).fetchAll();

        if (resources.length === 0) {
            context.log.warn(`No Cosmos record for blob ${blobName}`);
            return;
        }

        const media = resources[0];
        media.aiTags = vision.tags;
        media.contentSafety = { flagged: safety.flagged, checkedAt: new Date().toISOString() };
        await container.item(media.id, media.userId).replace(media);

        context.log(`Tagged ${blobName} with ${vision.tags.length} tags; flagged=${safety.flagged}`);
    } catch (err) {
        context.log.error("BlobTriggerAIAnalysis error:", err);
    }
};
