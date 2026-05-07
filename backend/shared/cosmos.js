const { CosmosClient } = require("@azure/cosmos");

let cachedContainer = null;

/**
 * Returns a Cosmos DB container client for media metadata.
 * Cached across invocations for performance.
 */
function getMediaContainer() {
    if (cachedContainer) return cachedContainer;

    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || "cloudgallery";
    const containerId = process.env.COSMOS_CONTAINER_MEDIA || "media";

    const client = new CosmosClient({ endpoint, key });
    cachedContainer = client.database(databaseId).container(containerId);
    return cachedContainer;
}

module.exports = { getMediaContainer };
