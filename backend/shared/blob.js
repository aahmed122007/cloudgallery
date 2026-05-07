const { BlobServiceClient } = require("@azure/storage-blob");

let cachedContainer = null;

function getBlobContainer() {
    if (cachedContainer) return cachedContainer;

    const connectionString = process.env.BLOB_CONNECTION_STRING;
    const containerName = process.env.BLOB_CONTAINER_NAME || "media";

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    cachedContainer = blobServiceClient.getContainerClient(containerName);
    return cachedContainer;
}

/**
 * Uploads a buffer to Blob Storage and returns the public URL.
 */
async function uploadBlob(buffer, blobName, contentType) {
    const container = getBlobContainer();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType }
    });
    return blockBlobClient.url;
}

async function deleteBlob(blobName) {
    const container = getBlobContainer();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
}

module.exports = { getBlobContainer, uploadBlob, deleteBlob };
