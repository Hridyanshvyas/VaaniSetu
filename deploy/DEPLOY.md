# VaaniSetu — Permanent Cloud Deployment Guide

## One-time setup (~30 min). After this: no laptop, no IP changes, ever.

---

## Step 1 — Push to GitHub

```bash
git init          # if not already a git repo
git add .
git commit -m "VaaniSetu production ready"
```

Create a new repo at https://github.com/new  
Then push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/vaanisetu.git
git push -u origin main
```

---

## Step 2 — Deploy to Render

1. Go to **https://render.com** → Sign up (free)
2. Click **New → Blueprint**
3. Connect your GitHub account → select the `vaanisetu` repo
4. Render reads `render.yaml` automatically
5. Before clicking Deploy, go to **Environment** and add:
   - `HF_TOKEN` = your Hugging Face token (needed to download gated models)
6. Click **Deploy**

First deploy takes ~20–30 min (downloads all models, ~25 GB).  
After that, redeploys are fast (models are cached on the 50 GB disk).

---

## Step 3 — Get your permanent URL

After deploy succeeds, Render gives you a URL like:
```
https://vaanisetu.onrender.com
```

Test it:
```
https://vaanisetu.onrender.com/health
```
Should return: `{"status": "ok", "service": "VaaniSetu backend"}`

---

## Step 4 — Build the final APK

The `BACKEND_HOST` in `frontend/src/config.ts` is already set to  
`vaanisetu.onrender.com`.

If Render gave you a different URL (e.g. `vaanisetu-xyz.onrender.com`),  
update that one line in `config.ts`, then:

```cmd
cd frontend
node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

cd android
.\gradlew assembleRelease
```

Then sign the APK:
```cmd
"C:\Users\hridy\AppData\Local\Android\Sdk\build-tools\37.0.0\apksigner.bat" sign --ks app\debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out ..\..\..\..\Desktop\VaaniSetu-final.apk app\build\outputs\apk\release\app-release.apk
```

Install `VaaniSetu-final.apk` on both phones.  
**This APK works forever — no rebuilds needed unless you change features.**

---

## Running locally (no cloud, laptop required)

```cmd
docker compose up --build
```
Models load from your existing HuggingFace cache. Phones must be on same WiFi.

---

## Plan comparison

| | Free tier | Starter ($7/mo) | Standard ($25/mo) |
|---|---|---|---|
| RAM | 512 MB | 1 GB | 4 GB |
| Sleeps after inactivity | Yes (15 min) | No | No |
| Suitable for VaaniSetu | ❌ Too little RAM | ❌ Too little RAM | ✅ Recommended |

For SIH demo day, use **Standard** for 1–2 days (~$2 total), then downgrade.
