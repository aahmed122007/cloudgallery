# Cosmos DB — NoSQL Setup

## Database & Container

Create a Cosmos DB account (Core SQL API), then:

| Setting | Value |
|---|---|
| Database ID | `cloudgallery` |
| Container ID | `media` |
| Partition key | `/userId` |
| Throughput | Serverless *(cheapest for coursework)* or 400 RU/s manual |

## Sample Document Structure

This is the shape of every record written by the `UploadMedia` function:

```json
{
  "id": "m-101-uuid",
  "mediaId": "m-101-uuid",
  "userId": "u-25-uuid",
  "userName": "Ali Ahmed",
  "title": "Beach Sunset",
  "description": "Shot on the Algarve coast at golden hour.",
  "type": "image",
  "blobName": "u-25-uuid/m-101-uuid.jpg",
  "blobUrl": "https://cloudgallerystorage.blob.core.windows.net/media/u-25-uuid/m-101-uuid.jpg",
  "tags": ["travel", "beach", "sunset"],
  "aiTags": ["sky", "cloud", "outdoor", "water", "sunset"],
  "likes": 40,
  "likedBy": ["u-10-uuid", "u-22-uuid"],
  "comments": [
    { "user": "Anna", "userId": "u-10-uuid", "text": "Nice photo!", "createdAt": "2026-04-20T10:15:00Z" }
  ],
  "uploadTime": "2026-04-20T09:00:00Z",
  "contentSafety": { "flagged": false, "checkedAt": "2026-04-20T09:00:05Z" }
}
```

## Why a partition key of `/userId`?

- Each user's media stays in one logical partition → fast per-user queries (e.g. "My Media", profile page).
- Writes distribute evenly across users at scale.
- Cross-partition queries (e.g. the global feed) are still supported — they just cost a bit more RU.
