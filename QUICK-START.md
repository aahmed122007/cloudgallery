# Quick Start — Your Next Steps

Ali, here's exactly what to do now, in order. Each step links to the full instructions.

## Step 1 — Set up your local environment (15 min)

Install the tools listed in **Part 0** of [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md#part-0--prerequisites-once).

Test locally before touching Azure:
```bash
cd backend
cp local.settings.json.template local.settings.json
# Edit local.settings.json with any test values — you can use a free Cosmos emulator
# or skip local testing entirely and go straight to Azure.
npm install
func start
```

In a second terminal:
```bash
cd frontend
# Serve it with any static server:
npx http-server -p 8080
# Open http://localhost:8080
```

If you want to skip local testing (which is totally fine for coursework), go to Step 2.

---

## Step 2 — Push to GitHub (5 min)

Follow **Part 1** of the deployment guide. You need a public GitHub repo for the CI/CD marks.

---

## Step 3 — Create Azure resources (45 min)

Follow **Parts 2 of the deployment guide** exactly. Copy-paste the shell commands.

**Critical:** change the `SUFFIX=aa347` line to something unique (your initials + some digits). Resource names must be globally unique in Azure.

If any `az` command fails with a name conflict, change the suffix and try again.

---

## Step 4 — Wire frontend to backend (5 min)

**Part 3** of the deployment guide. Just edit one line in `frontend/js/config.js` and push.

---

## Step 5 — Deploy the backend (10 min)

**Part 4** of the deployment guide. Easiest path: use Azure portal's Deployment Center to connect GitHub. After that every `git push` deploys automatically.

---

## Step 6 — Hook up the Blob Trigger (5 min)

**Part 5** of the deployment guide. This is what makes AI auto-tagging work.

---

## Step 7 — Smoke test (5 min)

**Part 6.** Open your Static Web App URL. Register, upload, see AI tags appear.

If anything breaks, check the Troubleshooting table at the bottom of the deployment guide.

---

## Step 8 — Record your demo (20 min)

Follow [VIDEO-SCRIPT.md](./VIDEO-SCRIPT.md) exactly. Rehearse once with a timer before hitting record.

Upload to Panopto via Blackboard.

---

## Step 9 — Shut it all down after marking (1 min)

```bash
az group delete --name cloudgallery-rg --yes --no-wait
```

One command — all Azure resources gone, no more billing.

---

## What the marker will see that ticks every rubric box

| Rubric section | How we hit it |
|---|---|
| Implementation (35%) | 12 Azure Functions covering all CRUD, working end-to-end |
| Use of Azure Resources (35%) | Functions + Blob + Cosmos + SQL + Static Web App + App Insights + AI Vision + Content Safety + Event Grid |
| Advanced Features (20%) | AI auto-tagging (Vision), content moderation (Content Safety), monitoring (App Insights), serverless auto-scaling, Event-Grid-driven async pipeline |
| Video Quality (10%) | Script keeps you under 5 min; webcam on; structured walkthrough |
| CI/CD (explicit requirement) | Two GitHub Actions workflows, shown live in the demo |

---

## If you get stuck

- **Auth errors:** 99% of the time it's a missing or mistyped env var in the Function App settings. Portal → Function App → Configuration.
- **CORS errors:** Portal → Function App → CORS → add `*` for testing.
- **Blob upload works but no tags appear:** Event Grid subscription wasn't created — rerun Part 5.
- **SQL connection fails:** Firewall rule for "Allow Azure services" is off — rerun the `az sql server firewall-rule create ... AllowAzureServices` command.

Everything you need is in the deployment guide. Go methodically, one part at a time, and don't skip verification steps.
