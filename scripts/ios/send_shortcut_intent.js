// Variables used by Scriptable.
// These must be at the top of the file to be recognized by Scriptable.
// icon-color: green; icon-glyph: location-arrow;

/**
 * Scriptable script to send a shortcut intent (envelope name + GPS location)
 * to the Penne API server.
 * Designed for iOS Scriptable & Apple Shortcuts integration.
 *
 * Input format from Apple Shortcuts:
 * - Can be passed as Action Parameter OR piped from prior action (e.g. Choose from List / Ask for Input)
 * - Accepts a simple string representing the envelope name (e.g. "Groceries")
 * - Or a JSON object / dictionary: { name: "Groceries", baseUrl: "...", token: "...", userUuid: "..." }
 *
 * Output format for Apple Shortcuts:
 * Returns the created ShortcutIntent response object or status summary dictionary.
 */

// ==========================================
// CONFIGURATION
// ==========================================
// Base URL of your Penne backend server (e.g., "http://192.168.1.X:8080" or "https://xxxx.ngrok-free.app")
const BASE_URL = "https://yak-crisp-vulture.ngrok-free.app/";

// Default user credentials (matches default Penne user session)
const USER_UUID = "f66dcebd-e275-4b22-83bd-e446e0a45624";
const BEARER_TOKEN = "f66dcebd-e275-4b22-83bd-e446e0a45624";

// Helper function to set output and complete script execution cleanly for iOS Shortcuts
function finishScript(output) {
  console.log("Script output: " + JSON.stringify(output));
  Script.setShortcutOutput(output);
  Script.complete();
}

// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  let baseUrl = BASE_URL;
  let userUuid = USER_UUID;
  let token = BEARER_TOKEN;
  let name = "";

  // Extract envelope name / configuration from either Action Parameter or piped Shortcuts input
  let input = args.shortcutParameter;
  if (!input && args.plainTexts && args.plainTexts.length > 0) {
    input = args.plainTexts[0];
  }

  if (input) {
    if (typeof input === "object" && input !== null) {
      if (input.name) name = String(input.name).trim();
      if (input.baseUrl) baseUrl = String(input.baseUrl).trim();
      if (input.userUuid) userUuid = String(input.userUuid).trim();
      if (input.token) token = String(input.token).trim();
    } else if (typeof input === "string") {
      const trimmedInput = input.trim();
      try {
        const parsed = JSON.parse(trimmedInput);
        if (typeof parsed === "object" && parsed !== null) {
          if (parsed.name) name = String(parsed.name).trim();
          if (parsed.baseUrl) baseUrl = String(parsed.baseUrl).trim();
          if (parsed.userUuid) userUuid = String(parsed.userUuid).trim();
          if (parsed.token) token = String(parsed.token).trim();
        } else {
          name = trimmedInput;
        }
      } catch (e) {
        name = trimmedInput;
      }
    }
  }

  if (!name) {
    const errMsg = "Error: No envelope category name provided from Apple Shortcuts input.";
    console.error(errMsg);
    finishScript({ error: errMsg, status: "failed" });
    return;
  }

  console.log(`Sending intent for envelope: "${name}"`);

  // Get current device GPS location using Scriptable Location API
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
    finishScript({ error: errMsg, status: "failed" });
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

    const resText = await req.loadString();
    let responseData;
    if (resText && resText.trim().length > 0) {
      try {
        responseData = JSON.parse(resText);
      } catch (e) {
        responseData = { status: "success", text: resText };
      }
    } else {
      responseData = {
        status: "success",
        message: "Shortcut intent created successfully",
        name: name,
        latitude: latitude,
        longitude: longitude
      };
    }

    console.log("Shortcut intent created successfully:", responseData);
    finishScript(responseData);
  } catch (err) {
    console.error(`Error sending shortcut intent: ${err.message || err}`);
    finishScript({ error: err.message || String(err), status: "failed" });
  }
}

main().catch(err => {
  console.error("Unhandled execution error: " + (err.message || err));
  finishScript({ error: String(err.message || err), status: "failed" });
});
