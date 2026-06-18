# Cast Console Setup Guide

One-time setup for the Google Cast integration (SETUP-03). Follow these steps once before testing with a real Chromecast. All device-gated E2E checks (CAST-01, CAST-03, CAST-05, RECV-01, RECV-04) require this registration to be complete.

---

## Prerequisites

- A Google account (choose carefully — see Step 1)
- A physical Chromecast device (serial number on the back/underside of the device)
- The neverman-darts-app deployed to GitHub Pages (the receiver URL must be live **before** Step 3)

---

## Step 1: Pay the one-time Cast Developer registration fee

1. Go to the [Google Cast SDK Developer Console](https://cast.google.com/publish).
2. Sign in with your Google account.
3. Pay the **one-time $5 USD registration fee** (non-refundable).

**Important — email is permanent (Pitfall 9):** The Google account email you use here **cannot be changed after registration**. There is no migration or transfer flow. Use the same Google account associated with the rest of the project (GitHub, etc.) or a dedicated project email. Enable 2FA on that account.

---

## Step 2: Create an unpublished Custom Receiver application

1. In the Cast Developer Console, click **Add New Application**.
2. Select **Custom Receiver**.
3. Give it a name, e.g. `Neverman Darts`.
4. Set **Status** to **Unpublished** — this is for private home use. No Google review is needed. Unpublished apps are visible only to registered test devices.

**Do not publish** — the app only needs to run on your own registered Chromecast, not on the public Cast network.

---

## Step 3: Set the receiver URL — deploy first, then register (Pitfall 10)

**Critical ordering: deploy the app BEFORE entering the URL in Cast Console.**

If you register a URL that does not yet return the correct receiver HTML, the Chromecast will receive a 404 or the SPA shell, and the sender will get a `LAUNCH_ERROR` with no helpful message.

### 3a. Deploy the app to GitHub Pages

Push to `main` or `master` and wait for the GitHub Actions workflow to complete. Check the Actions tab to confirm the deploy step succeeds.

### 3b. Verify the receiver URL returns real HTML

Open a browser (or `curl`) and confirm this URL returns your scoreboard HTML — not a 404 and not the SPA shell:

```
https://<your-github-username>.github.io/neverman-darts-app/display
```

You should see the `/display` scoreboard page render in the browser. The page title should read "Neverman Darts" (or similar), not a generic error page.

### 3c. Enter the verified URL in Cast Console

In your new Custom Receiver application, set the **Application URL** to the exact URL you verified above:

```
https://<your-github-username>.github.io/neverman-darts-app/display
```

Include the trailing path exactly. The URL must use `https://` (required by Cast).

If you ever rename the GitHub repository, the URL changes and the Cast Console registration must be updated (which triggers another propagation wait + device reboot cycle).

---

## Step 4: Register your Chromecast by serial number

1. In the Cast Developer Console, navigate to **Devices** (in the left sidebar).
2. Click **Add New Device**.
3. Enter your Chromecast's serial number. The serial is printed on the back or underside of the device (also visible in the Google Home app under device settings).
4. Give the device a name, e.g. `Wohnzimmer Chromecast`.

Only registered devices can load unpublished receivers. Your Chromecast will not be able to run the app until it appears here.

---

## Step 5: Wait ~15 minutes, then reboot the Chromecast

After any registration or URL change in Cast Console, Google's servers take **5–15 minutes to propagate** the change. The Chromecast firmware picks up the new config only after a reboot.

1. Wait at least 15 minutes after completing Steps 2–4.
2. Physically unplug the Chromecast from power, wait 10 seconds, and plug it back in.
3. In the Cast Developer Console, confirm the device status shows **Ready for Testing** before proceeding.

Do not change the receiver URL again during active development — every change restarts the propagation clock (Pitfall 11).

---

## Step 6: Copy the App ID into the build configuration

After registration, Cast Console assigns a unique **Application ID** (e.g. `A1B2C3D4`) to your Custom Receiver.

### GitHub Actions (deployed build)

Add the App ID as a **repo variable** (not a secret — it ships in the client bundle) in GitHub:

1. Go to your repository → **Settings → Secrets and variables → Actions → Variables**.
2. Click **New repository variable**.
3. Name: `VITE_CAST_APP_ID` / Value: your Application ID.

The `deploy.yml` workflow injects this automatically at build time (SETUP-02):

```yaml
VITE_CAST_APP_ID: ${{ vars.VITE_CAST_APP_ID }}
```

### Local development (`.env.local`)

Create a `.env.local` file in the project root (this file is gitignored by the `.env.*` rule in `.gitignore`):

```
VITE_CAST_APP_ID=A1B2C3D4
```

See `.env.example` for the documented placeholder.

The App ID is **not a secret** — it is a public identifier that the Cast SDK uses to look up which receiver URL to load. It ends up in the compiled JS bundle. Use a plain repo variable in GitHub Actions, never a secret (D-09/SETUP-02).

---

## Step 7: Verify the integration works

Once the App ID is in place and the Chromecast is registered and rebooted:

1. Open `/match` in **Chrome** (desktop or Android) on the **same LAN** as the Chromecast.
2. Tap the monitor icon (SpectatorChooser) in the match header.
3. The **"Auf Chromecast übertragen"** row should appear in the chooser menu (visible only in Chrome with a Cast-capable device on the network).
4. Tap the row to open the native Cast device-selection dialog.
5. Select your Chromecast device.
6. Confirm the TV shows the live scoreboard (`/display` layout).
7. Throw some darts — confirm the TV score updates in real time.

If the Cast row does not appear: confirm `VITE_CAST_APP_ID` is set, the build was re-deployed after adding it, and the Chromecast is on the same WiFi network.

---

## All device-gated checks require this registration

The following requirements cannot be verified without a registered Chromecast on the local network:

| Requirement | What it tests |
|-------------|---------------|
| CAST-01 | User can start casting from `/match` |
| CAST-03 | "Überträgt auf: \<Gerät\>" indicator shows device name |
| CAST-05 | Auto-rejoin after tablet reload during active cast |
| RECV-01 | Chromecast loads `/display` as Custom Web Receiver |
| RECV-04 | Receiver stays connected through long auto-pause breaks |

These checks are listed as "device-gated" in the E2E test plan. Do not mark them verified without a real device.
