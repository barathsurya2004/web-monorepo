// Variables used by Scriptable.
// These must be at the top of the file to be recognized by Scriptable.
// icon-color: blue; icon-glyph: wallet;

/**
 * Scriptable script to fetch user envelopes from Penne API.
 * Designed for iOS Scriptable & Apple Shortcuts integration.
 *
 * Output format for Apple Shortcuts:
 * Returns an array of Envelope objects: [{ id, name, display_label, ... }]
 * You can feed this directly into "Choose from List" in Apple Shortcuts.
 */

// ==========================================
// CONFIGURATION
// ==========================================
// Base URL of your Penne backend server (e.g., "http://192.168.1.X:8080" or "https://xxxx.ngrok-free.app")
const BASE_URL = "https://yak-crisp-vulture.ngrok-free.app/";

// Test/User credentials (matches default Penne user session)
const USER_UUID = "f66dcebd-e275-4b22-83bd-e446e0a45624";
const BEARER_TOKEN = "f66dcebd-e275-4b22-83bd-e446e0a45624";

// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  let baseUrl = BASE_URL;
  let userUuid = USER_UUID;
  let token = BEARER_TOKEN;

  // Allow overriding configuration dynamically from Apple Shortcuts input parameter
  if (args.shortcutParameter) {
    try {
      const input = typeof args.shortcutParameter === "string"
        ? JSON.parse(args.shortcutParameter)
        : args.shortcutParameter;
      if (input.baseUrl) baseUrl = input.baseUrl;
      if (input.userUuid) userUuid = input.userUuid;
      if (input.token) token = input.token;
    } catch (e) {
      console.log("Shortcut parameter was not JSON, using script default config.");
    }
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/envelopes?user_uuid=${encodeURIComponent(userUuid)}`;
  console.log(`Fetching envelopes from: ${endpoint}`);

  try {
    const req = new Request(endpoint);
    req.method = "GET";
    req.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true"
    };

    const response = await req.loadJSON();

    if (!Array.isArray(response)) {
      throw new Error(`Invalid response format from server: ${JSON.stringify(response)}`);
    }

    // Map envelopes to user-friendly objects for Apple Shortcuts
    const envelopeList = response.map(env => ({
      id: env.id,
      name: env.name || `Envelope #${env.id.slice(-4)}`,
      envelope_group_id: env.envelope_group_id,
      is_system: !!env.is_system,
      display_label: `${env.name || 'Envelope'} (${env.id})`
    }));

    console.log(`Successfully retrieved ${envelopeList.length} envelopes.`);

    if (config.runsInShortcuts) {
      // Pass the envelope list back to Apple Shortcuts workflow
      Script.setShortcutOutput(envelopeList);
    } else if (config.runsInApp) {
      // Interactive test dialog inside Scriptable App
      const alert = new Alert();
      alert.title = "Envelopes";
      alert.message = `Fetched ${envelopeList.length} envelopes successfully.`;

      envelopeList.forEach(env => {
        alert.addAction(env.display_label);
      });
      alert.addCancelAction("Close");

      const selectedIndex = await alert.presentAlert();
      if (selectedIndex >= 0 && selectedIndex < envelopeList.length) {
        const selected = envelopeList[selectedIndex];
        const detailAlert = new Alert();
        detailAlert.title = "Selected Envelope";
        detailAlert.message = `Name: ${selected.name}\nID: ${selected.id}\nGroup ID: ${selected.envelope_group_id}`;
        detailAlert.addAction("OK");
        await detailAlert.present();
      }
    } else {
      console.log(JSON.stringify(envelopeList, null, 2));
    }
  } catch (err) {
    console.error(`Error fetching envelopes: ${err.message || err}`);
    if (config.runsInShortcuts) {
      Script.setShortcutOutput({ error: err.message || String(err) });
    }
  }

  Script.complete();
}

await main();
