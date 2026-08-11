# Scripts Directory

This directory hosts mobile automation scripts (iOS / Scriptable, Android, etc.) for interacting with the Penne API.

## Structure

```
scripts/
├── README.md
└── ios/
    └── get_envelopes.js   # Scriptable JS script to fetch envelopes for Apple Shortcuts
```

---

## iOS Scriptable Setup Guide

### 1. Script #1: Get Envelopes (`scripts/ios/get_envelopes.js`)

#### Step A: Add Script to Scriptable App
1. Download & open the **Scriptable** app from the iOS App Store.
2. Tap the `+` button in the top right to add a new script.
3. Paste the contents of `scripts/ios/get_envelopes.js`.
4. Update `BASE_URL` to point to your backend API server (e.g., `http://192.168.1.50:8080` or your `ngrok` URL).
5. Name the script **`Get Envelopes`**.

#### Step B: Apple Shortcuts Setup
1. Open the **Shortcuts** app on your iPhone.
2. Create a **New Shortcut**.
3. Add action: **Scriptable > Run Script** and select **Get Envelopes**.
4. Add action: **Choose from List** and select the output of the Scriptable action as the input list.
   - You can choose to display item names or dictionary values (e.g. `display_label` or `name`).
5. Add action: **Get Dictionary Value** or pass the selected item (`id`) to your next step.

---

## Planned Scripts (Future Scope)
- **Script #2**: Send transaction details (Envelope ID + GPS Location) to backend for fuzzy matching and transaction updates.
