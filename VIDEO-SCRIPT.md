# CloudGallery — 5-Minute Video Demo Script

Designed to maximise marks across every CW2 rubric section (Implementation 35%,
Azure Resources 35%, Advanced Features 20%, Video Quality 10%).

Aim for **exactly 4:30 to 4:55**. Over 5 minutes loses 10%+, so rehearse with a timer.

> **Recording:** Use Panopto Capture from Blackboard. Record both screen + webcam
> so the marker can see you — the rubric explicitly mentions this.

---

## 0:00 – 0:15 — Intro (15s)

> "Hi, I'm Ali Ahmed, student number B00974347. This is my CW2 walkthrough of
> CloudGallery — a serverless multimedia sharing platform I designed in CW1 and
> implemented using Microsoft Azure. I'll show the live app, the Azure resources
> behind it, and the advanced features."

**On screen:** the deployed Static Web App home page.

---

## 0:15 – 1:45 — CRUD demo in the running app (90s)

Hit every CRUD operation the rubric mentions.

1. **CREATE (user):** register as a fresh user → account is created via POST /users/register, writes to Azure SQL.
2. **CREATE (media):** Upload page → drag in an image, fill title + tags → submit. Narrate:
   > "This POSTs to /api/media — the file streams into Blob Storage, metadata goes
   > into Cosmos DB, and the Event Grid trigger fires an AI Vision analysis."
3. **READ:** Dashboard loads the feed via GET /media.
4. **UPDATE:** Open a media item → click like → comment. Narrate:
   > "PUT /media/{id} is handling both the like toggle and the comment addition."
5. **DELETE:** On your own item → delete. Narrate:
   > "DELETE /media/{id} removes the blob *and* the Cosmos record together."

---

## 1:45 – 3:15 — Azure resources tour (90s)

Switch to the Azure portal, **cloudgallery-rg** resource group view. Click through each resource quickly — the rubric marks "use of Azure resources" 35%.

1. **Static Web App** — "Hosts the HTML/CSS/JS frontend globally with auto-scaling."
2. **Function App** — open → Functions list → show 12 functions. Click one (e.g. `UploadMedia`) → Monitor → point at recent successful invocations.
3. **Storage Account** → Containers → `media` → open the folder for your user → confirm the uploaded file is there.
4. **Cosmos DB** → Data Explorer → `cloudgallery` → `media` → open the record for the image you just uploaded. Point at the `aiTags` array:
   > "These tags were generated automatically by Azure AI Vision the moment the blob was created."
5. **Azure SQL Database** → Query editor → `SELECT * FROM Users` → show the registered account.
6. **Application Insights** → Live Metrics → show the request stream in real time.

---

## 3:15 – 4:15 — Advanced features (60s)

Back in the portal:

1. **Azure AI Vision** resource → keys/endpoint. Narrate:
   > "Integrated via the BlobTriggerAIAnalysis function. Each upload is analysed
   > asynchronously, so the response to the user is instant while tagging happens
   > in the background."
2. **Azure AI Content Safety** resource. Narrate:
   > "The same trigger also scores the image against four safety categories; a
   > `contentSafety.flagged` field is written to Cosmos DB if severity exceeds 4."
3. **Application Insights** — point at Failures/Performance tabs.
4. **Event Grid subscription** on the storage account → show the subscription targets the Function App.
5. **Auto-scaling:** open Function App → Scale out. Narrate:
   > "Consumption plan — scales from 0 to 200 instances automatically, zero admin overhead."

---

## 4:15 – 4:45 — CI/CD pipeline (30s)

Switch to the GitHub repo:

1. **Actions** tab → latest "Deploy Backend" run → green check. Narrate:
   > "Every push to main triggers the GitHub Actions workflow that builds and
   > publishes the Function App. The second workflow does the same for the
   > Static Web App."
2. Make a trivial code change (e.g. update a comment) → commit → push → show the workflow starting.

---

## 4:45 – 5:00 — Close (15s)

> "That's the full CloudGallery deployment: 12 functions, two databases, AI-powered
> tagging, content safety, and automated CI/CD — all built on Azure's serverless
> stack. Thanks for watching."

---

## Rubric checklist — make sure each item was visible on screen

- [ ] Camera turned on with you visible
- [ ] Running application with CRUD (create/upload/update/delete) **working**
- [ ] REST API calls happening in the browser (press F12 → Network tab if time)
- [ ] Backend Azure resources: Function App, Cosmos DB, Blob Storage, SQL, App Insights, AI Vision, AI Content Safety, Static Web App
- [ ] CI/CD pipeline (GitHub Actions) shown
- [ ] Each advanced feature explicitly named and demonstrated
- [ ] Under 5 minutes total
