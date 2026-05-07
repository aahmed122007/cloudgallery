# CloudGallery — Complete Deployment Guide

End-to-end steps to get CloudGallery running on Azure. Follow in order; don't skip.
Total time: about **90–120 minutes** first time.

---

## Part 0 — Prerequisites (once)

Install these on your machine:

1. **Node.js 20 LTS** — https://nodejs.org
2. **Azure CLI** — https://learn.microsoft.com/cli/azure/install-azure-cli
3. **Azure Functions Core Tools v4** — `npm install -g azure-functions-core-tools@4 --unsafe-perm true`
4. **Git** — https://git-scm.com
5. **VS Code** (recommended) with extensions: *Azure Functions*, *Azure Static Web Apps*.
6. **Azure for Students subscription** — https://azure.microsoft.com/free/students (free £100 credit, no card required)

Verify:
```bash
node --version     # should be v20.x
az --version
func --version     # should be 4.x
git --version
```

Sign into Azure CLI:
```bash
az login
az account show   # confirm the right subscription is active
```

---

## Part 1 — Push this project to GitHub

```bash
cd cloudgallery
git init
git add .
git commit -m "Initial commit: CloudGallery scaffold"
```

Create an empty repo on GitHub (name it `cloudgallery`), then:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/cloudgallery.git
git push -u origin main
```

---

## Part 2 — Create the Azure resources

Set some shell variables first — this keeps commands consistent. **Change `SUFFIX` to something unique** (your initials + 3 digits, e.g. `aa347`):

```bash
RG=cloudgallery-rg
LOCATION=uksouth
SUFFIX=aa347                            # <-- CHANGE THIS
STORAGE=cgstorage$SUFFIX                # must be lowercase, ≤24 chars
FUNCAPP=cloudgallery-api-$SUFFIX
SWA=cloudgallery-web-$SUFFIX
COSMOS=cg-cosmos-$SUFFIX
SQL_SERVER=cg-sql-$SUFFIX
SQL_DB=cloudgallery
SQL_ADMIN=cgadmin
SQL_PASSWORD='ChangeMe!Now#2026'        # <-- USE A STRONG PASSWORD
VISION=cg-vision-$SUFFIX
CONTENTSAFETY=cg-safety-$SUFFIX
APPINSIGHTS=cg-insights-$SUFFIX
```

### 2.1 — Resource group

```bash
az group create --name $RG --location $LOCATION
```

### 2.2 — Storage account (holds blobs + Functions runtime files)

```bash
az storage account create \
  --name $STORAGE \
  --resource-group $RG \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Container for uploads
az storage container create \
  --name media \
  --account-name $STORAGE \
  --public-access blob

# Grab the connection string for later
STORAGE_CONN=$(az storage account show-connection-string --name $STORAGE --resource-group $RG --query connectionString -o tsv)
echo "STORAGE_CONN=$STORAGE_CONN"
```

### 2.3 — Cosmos DB (NoSQL for media metadata)

```bash
az cosmosdb create \
  --name $COSMOS \
  --resource-group $RG \
  --locations regionName=$LOCATION \
  --capabilities EnableServerless \
  --default-consistency-level Session

az cosmosdb sql database create \
  --account-name $COSMOS \
  --resource-group $RG \
  --name cloudgallery

az cosmosdb sql container create \
  --account-name $COSMOS \
  --resource-group $RG \
  --database-name cloudgallery \
  --name media \
  --partition-key-path "/userId"

COSMOS_ENDPOINT=$(az cosmosdb show --name $COSMOS --resource-group $RG --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name $COSMOS --resource-group $RG --query primaryMasterKey -o tsv)
echo "COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
```

### 2.4 — Azure SQL Database (relational for users)

```bash
az sql server create \
  --name $SQL_SERVER \
  --resource-group $RG \
  --location $LOCATION \
  --admin-user $SQL_ADMIN \
  --admin-password "$SQL_PASSWORD"

# Cheapest tier — plenty for coursework
az sql db create \
  --name $SQL_DB \
  --server $SQL_SERVER \
  --resource-group $RG \
  --edition Basic \
  --capacity 5

# Allow Azure services through the firewall
az sql server firewall-rule create \
  --resource-group $RG \
  --server $SQL_SERVER \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow YOUR IP so you can run the schema script
MY_IP=$(curl -s ifconfig.me)
az sql server firewall-rule create \
  --resource-group $RG \
  --server $SQL_SERVER \
  --name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

**Now apply the schema**. Open the Azure portal → your SQL DB → **Query editor** → sign in with `$SQL_ADMIN` and `$SQL_PASSWORD` → paste the contents of `database/schema.sql` → **Run**.

### 2.5 — Application Insights

```bash
az monitor app-insights component create \
  --app $APPINSIGHTS \
  --location $LOCATION \
  --resource-group $RG

APPINSIGHTS_KEY=$(az monitor app-insights component show --app $APPINSIGHTS --resource-group $RG --query instrumentationKey -o tsv)
```

### 2.6 — Azure AI Vision + Content Safety (advanced features)

```bash
# Vision (auto-tagging)
az cognitiveservices account create \
  --name $VISION \
  --resource-group $RG \
  --kind ComputerVision \
  --sku F0 \
  --location $LOCATION \
  --yes

VISION_ENDPOINT=$(az cognitiveservices account show --name $VISION --resource-group $RG --query properties.endpoint -o tsv)
VISION_KEY=$(az cognitiveservices account keys list --name $VISION --resource-group $RG --query key1 -o tsv)

# Content Safety (moderation)
az cognitiveservices account create \
  --name $CONTENTSAFETY \
  --resource-group $RG \
  --kind ContentSafety \
  --sku F0 \
  --location $LOCATION \
  --yes

CS_ENDPOINT=$(az cognitiveservices account show --name $CONTENTSAFETY --resource-group $RG --query properties.endpoint -o tsv)
CS_KEY=$(az cognitiveservices account keys list --name $CONTENTSAFETY --resource-group $RG --query key1 -o tsv)
```

> **Note:** `F0` is the free tier. If `F0` is unavailable in your region, use `S0` (paid, pennies for coursework usage).

### 2.7 — Function App (the backend)

```bash
az functionapp create \
  --resource-group $RG \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCAPP \
  --storage-account $STORAGE \
  --os-type Linux \
  --app-insights $APPINSIGHTS \
  --app-insights-key $APPINSIGHTS_KEY
```

Push every app setting the backend needs:

```bash
JWT_SECRET=$(openssl rand -hex 32)

az functionapp config appsettings set \
  --name $FUNCAPP --resource-group $RG \
  --settings \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_KEY="$COSMOS_KEY" \
    COSMOS_DATABASE="cloudgallery" \
    COSMOS_CONTAINER_MEDIA="media" \
    BLOB_CONNECTION_STRING="$STORAGE_CONN" \
    BLOB_CONTAINER_NAME="media" \
    STORAGE_ACCOUNT_NAME="$STORAGE" \
    SQL_SERVER="$SQL_SERVER.database.windows.net" \
    SQL_DATABASE="$SQL_DB" \
    SQL_USER="$SQL_ADMIN" \
    SQL_PASSWORD="$SQL_PASSWORD" \
    JWT_SECRET="$JWT_SECRET" \
    JWT_EXPIRY="24h" \
    COMPUTER_VISION_ENDPOINT="$VISION_ENDPOINT" \
    COMPUTER_VISION_KEY="$VISION_KEY" \
    CONTENT_SAFETY_ENDPOINT="$CS_ENDPOINT" \
    CONTENT_SAFETY_KEY="$CS_KEY"

# Enable CORS so the Static Web App can call the API
az functionapp cors add \
  --name $FUNCAPP --resource-group $RG \
  --allowed-origins "*"
```

### 2.8 — Static Web App (the frontend)

Easiest path is the portal because it wires up GitHub Actions automatically:

1. Azure portal → **Create a resource** → **Static Web App**.
2. Resource group: `cloudgallery-rg`, name: `cloudgallery-web-<your-suffix>`, plan: **Free**.
3. Deployment source: **GitHub** — authorise, pick your `cloudgallery` repo and `main` branch.
4. Build presets: **Custom**.
   - App location: `frontend`
   - API location: *(leave blank)*
   - Output location: *(leave blank)*
5. Click **Review + create** → **Create**.

Azure will automatically commit a workflow file to your repo. That's fine — our bundled `deploy-frontend.yml` will still work for future changes.

---

## Part 3 — Wire the frontend to the backend

1. Get the Function App URL:
   ```bash
   echo "https://$FUNCAPP.azurewebsites.net/api"
   ```
2. Edit `frontend/js/config.js` and replace the value of `API_BASE` with that URL.
3. Commit and push:
   ```bash
   git add frontend/js/config.js
   git commit -m "Point frontend at deployed API"
   git push
   ```
4. The Static Web App workflow will redeploy automatically in about 1–2 minutes.

---

## Part 4 — Deploy the backend code

Option A — GitHub Actions (recommended, matches the CW1 CI/CD requirement):

1. Azure portal → your Function App → **Deployment Center** → GitHub → select your repo/branch.
   Azure will download the publish profile and add it as a secret named
   `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` in the repo.
2. In the repo **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `AZURE_FUNCTIONAPP_NAME` → `cloudgallery-api-<suffix>`
3. Push any commit to `main` (or run the workflow manually). It deploys to Azure.

Option B — CLI (one-off):
```bash
cd backend
npm install --production
func azure functionapp publish $FUNCAPP
```

---

## Part 5 — Hook up the Blob Trigger (AI tagging)

The `BlobTriggerAIAnalysis` function needs Event Grid events from the storage account.

```bash
# Get resource IDs
STORAGE_ID=$(az storage account show --name $STORAGE --resource-group $RG --query id -o tsv)
FUNC_ID=$(az functionapp show --name $FUNCAPP --resource-group $RG --query id -o tsv)

# Register Event Grid provider (first time only)
az provider register --namespace Microsoft.EventGrid

# Create the event subscription pointing at the blob-triggered function
az eventgrid event-subscription create \
  --name media-uploaded \
  --source-resource-id $STORAGE_ID \
  --endpoint "$FUNC_ID/functions/BlobTriggerAIAnalysis" \
  --endpoint-type azurefunction \
  --included-event-types Microsoft.Storage.BlobCreated \
  --subject-begins-with "/blobServices/default/containers/media/"
```

That's it — every new blob upload automatically triggers AI tagging + content safety checks, and the resulting tags are written back to Cosmos DB.

---

## Part 6 — Smoke test everything

1. Open your Static Web App URL (Azure portal → SWA → **URL**).
2. **Register** a new user.
3. **Upload** an image.
4. Wait ~10 seconds and refresh. You should see the image appear in the feed with purple **"AI: ..."** tags showing that Vision analysed it.
5. Open Application Insights → **Live Metrics** to see requests streaming in.

---

## Part 7 — Preparing the 5-minute demo video

See `VIDEO-SCRIPT.md` for the walkthrough outline that matches the CW2 rubric.

---

## Troubleshooting cheat-sheet

| Symptom | Fix |
|---|---|
| `CORS error` in browser | Check CORS on Function App → add `*` or your SWA origin |
| `401 Unauthorized` on every call | JWT_SECRET not set in Function App settings |
| `ENOTFOUND ...database.windows.net` | SQL firewall blocks Functions — rerun the AllowAzureServices rule |
| Blob trigger never fires | Event Grid subscription missing (Part 5) |
| Upload fails silently | File > 10 MB, or `media` container not created, or connection string wrong |
| Vision returns empty tags | Check `COMPUTER_VISION_ENDPOINT/KEY` in Function App config |
| `bcrypt` fails to install | Use `bcryptjs` (already in package.json) — avoid native `bcrypt` |

---

## Cost control

Before you finish the course, **delete the resource group** to stop all billing:

```bash
az group delete --name $RG --yes --no-wait
```

Everything we created sits in `cloudgallery-rg`, so one command wipes it clean.
