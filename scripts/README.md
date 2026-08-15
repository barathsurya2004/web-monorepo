# Scripts Directory

This directory hosts mobile automation scripts (iOS / Scriptable, Android, etc.) for interacting with the Penne API.

## Structure

```
scripts/
├── README.md
└── ios/
    ├── get_envelopes.js        # Scriptable JS script to fetch envelopes for Apple Shortcuts
    └── send_shortcut_intent.js # Scriptable JS script to send envelope intent + GPS location to backend
```

---

## iOS Scriptable Setup Guide

### 1. Script #1: Get Envelopes (`scripts/ios/get_envelopes.js`)

#### Step A: Add Script to Scriptable App
1. Download & open the **Scriptable** app from the iOS App Store.
2. Tap the `+` button in the top right to add a new script.
3. Paste the contents of `scripts/ios/get_envelopes.js`.
4. Update `BASE_URL` to point to your backend API server (e.g., `http://192.168.1.X:8080` or your `ngrok` URL).
5. Name the script **`Get Envelopes`**.

#### Step B: Apple Shortcuts Setup
1. Open the **Shortcuts** app on your iPhone.
2. Create a **New Shortcut**.
3. Add action: **Scriptable > Run Script** and select **Get Envelopes**.
4. Add action: **Choose from List** and select the output of the Scriptable action as the input list.
   - You can choose to display item names or dictionary values (e.g. `display_label` or `name`).
5. Add action: **Get Dictionary Value** or pass the selected item (`id` or `name`) to your next step.

---

### 2. Script #2: Send Shortcut Intent (`scripts/ios/send_shortcut_intent.js`)

#### Step A: Add Script to Scriptable App
1. Open the **Scriptable** app.
2. Tap `+` to create a new script.
3. Paste the contents of `scripts/ios/send_shortcut_intent.js`.
4. Update `BASE_URL` (and optional `USER_UUID` / `BEARER_TOKEN` defaults if needed).
5. Name the script **`Send Shortcut Intent`**.

#### Step B: Apple Shortcuts Setup & Workflow
1. Open **Apple Shortcuts**.
2. Pass an envelope name variable (e.g. from **Choose from List** output, prompt text, or Siri prompt variable `name`) into the Scriptable action.
3. Add action: **Scriptable > Run Script**.
4. Select script: **Send Shortcut Intent**.
5. Set **Parameter**: Pass the variable `name` (or dictionary object `{ "name": "Groceries" }`).
6. Enable location permissions for Scriptable when prompted on initial run.
7. The script automatically fetches high-accuracy GPS coordinates, attaches the `Authorization: Bearer <token>` header, and posts the intent payload to `/api/create-new-intent`.
