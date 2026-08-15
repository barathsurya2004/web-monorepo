// Variables used by Scriptable.
// These must be at the top of the file to be recognized by Scriptable.
// icon-color: green; icon-glyph: location-arrow;

/**
 * Scriptable script to send a shortcut intent (envelope name + GPS location)
 * to the Penne API server.
 * Designed for iOS Scriptable & Apple Shortcuts integration.
 *
 * Input format from Apple Shortcuts:
 * - Can be a simple string representing the envelope name (e.g. "Groceries")
 * - Or a JSON object / dictionary: { name: "Groceries", baseUrl: "...", token: "...", userUuid: "..." }
 *
 * Output format for Apple Shortcuts:
 * Returns the created ShortcutIntent response object or error status.
 */

// ==========================================
// CONFIGURATION
// ==========================================
// Base URL of your Penne backend server (e.g., "http://192.168.1.X:8080" or "https://xxxx.ngrok-free.app")
const BASE_URL = "https://yak-crisp-vulture.ngrok-free.app/";

// Default user credentials (matches default Penne user session)
const USER_UUID = "f66dcebd-e275-4b22-83bd-e446e0a45624";
const BEARER_TOKEN = "f66dcebd-e275-4b22-83bd-e446e0a45624";

// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  let baseUrl = BASE_URL;
  let userUuid = USER_UUID;
  let token = BEARER_TOKEN;
  let name = "";

  // Extract envelope name and optional configuration overrides from Shortcuts input
  if (args.shortcutParameter) {
    const input = args.shortcutParameter;
    if (typeof input === "object" && input !== null) {
      if (input.name) name = input.name;
      if (input.baseUrl) baseUrl = input.baseUrl;
      if (input.userUuid) userUuid = input.userUuid;
      if (input.token) token = input.token;
    } else if (typeof input === "string") {
      try {
        const parsed = JSON.parse(input);
        if (typeof parsed === "object" && parsed !== null) {
          if (parsed.name) name = parsed.name;
          if (parsed.baseUrl) baseUrl = parsed.baseUrl;
          if (parsed.userUuid) userUuid = parsed.userUuid;
          if (parsed.token) token = parsed.token;
        } else {
          name = input;
        }
      } catch (e) {
        name = input;
      }
    }
  }

  if (!name) {
    const errMsg = "Error: No envelope category name provided from shortcut input.";
    console.error(errMsg);
    if (config.runsInShortcuts || config.runsWithSiri) {
      Script.setShortcutOutput({ error: errMsg });
    }
    Script.complete();
    return;
  }

  console.log(`Sending intent for envelope: "${name}"`);

  // Get current device location using Scriptable Location API
  let latitude = 0.0;
  let longitude = 0.0;
  try {
    console.log("Fetching current GPS location...");
    Location.setAccuracyToBest();
    const loc = await Location.current();
    latitude = loc.latitude;
    longitude = loc.longitude;
    console.log(`Location obtained: (${latitude}, ${longitude})`);
  } catch (locErr) {
    console.error(`Failed to acquire GPS location: ${locErr.message || locErr}`);
    const errMsg = `Location error: ${locErr.message || String(locErr)}`;
    if (config.runsInShortcuts || config.runsWithSiri) {
      Script.setShortcutOutput({ error: errMsg });
    }
    Script.complete();
    return;
  }

  // Construct request URL & payload
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/create-new-intent`;
  const payload = {
    name: name,
    latitude: latitude,
    longitude: longitude,
  };

  console.log(`Posting intent payload to: ${endpoint}`);
  console.log(`Payload: ${JSON.stringify(payload)}`);

  try {
    const req = new Request(endpoint);
    req.method = "POST";
    req.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true"
    };
    req.body = JSON.stringify(payload);

    const response = await req.loadJSON();
    console.log("Shortcut intent created successfully:", response);

    if (config.runsInShortcuts || config.runsWithSiri) {
      Script.setShortcutOutput(response);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (err) {
    console.error(`Error sending shortcut intent: ${err.message || err}`);
    if (config.runsInShortcuts || config.runsWithSiri) {
      Script.setShortcutOutput({ error: err.message || String(err) });
    }
  }

  Script.complete();
}

await main();
