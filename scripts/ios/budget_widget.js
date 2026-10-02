// Variables used by Scriptable.
// These must be at the top of the file to be recognized by Scriptable.
// icon-color: purple; icon-glyph: chart-pie;

/**
 * Penne Budget Widget v2 (iOS Scriptable, small)
 * Glass-safe: hierarchy by brightness,
 * size, glyphs. Not hue alone.
 */

// ==========================================
// CONFIG
// ==========================================
const BASE_URL = "https://yak-crisp-vulture.ngrok-free.app/";
const USER_UUID = "f66dcebd-e275-4b22-83bd-e446e0a45624";
const BEARER_TOKEN = "78504dcf-6683-4acc-84ae-417bd41ae6bc";

const REFRESH_MINUTES = 15;

// Text brightness tiers survive tinting
const THEME = {
  bgTop: "#221E45",
  bgBottom: "#0D0B20",
  white: "#FFFFFF",
  mint: "#A8E6CF",
  coral: "#FFB5A7",
  peach: "#FBD8B3",
  lavender: "#C8B6FF"
};
const ALPHA = { primary: 1, secondary: 0.72, tertiary: 0.55 };

// ==========================================
// CACHE
// ==========================================
const CACHE_FILE = "penne_budget_widget_cache.json";

function getCachePath() {
  const fm = FileManager.local();
  return fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
}

function saveCache(data) {
  try {
    FileManager.local().writeString(getCachePath(), JSON.stringify(data));
  } catch (err) {
    console.warn("cache write: " + err);
  }
}

function readCache() {
  try {
    const fm = FileManager.local();
    const path = getCachePath();
    if (fm.fileExists(path)) return JSON.parse(fm.readString(path));
  } catch (err) {
    console.warn("cache read: " + err);
  }
  return null;
}

// ==========================================
// HELPERS
// ==========================================
function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  const neg = amount < 0;
  const abs = Math.round(Math.abs(amount));
  return `${neg ? "-" : ""}₹${abs.toLocaleString("en-IN")}`;
}

function formatShort(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 10000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  return formatINR(amount);
}

function e5ToAmount(e5) {
  if (typeof e5 !== "number" || isNaN(e5)) return 0;
  return e5 / 100000;
}

function daysLeft(endStr) {
  if (!endStr) return null;
  const end = new Date(endStr);
  if (isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return diff < 0 ? 0 : diff;
}

function rounded(size, heavy) {
  if (Font.boldRoundedSystemFont) return Font.boldRoundedSystemFont(size);
  return heavy ? Font.heavySystemFont(size) : Font.boldSystemFont(size);
}

// ==========================================
// API
// ==========================================
async function fetchEndpoint(url, token) {
  const req = new Request(url);
  req.method = "GET";
  req.headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true"
  };
  req.timeoutInterval = 10;
  return await req.loadJSON();
}

async function safeFetch(url, token) {
  try {
    return await fetchEndpoint(url, token);
  } catch (err) {
    console.warn(`fetch fail: ${err.message || err}`);
    return null;
  }
}

async function loadData(baseUrl, userUuid, token) {
  const base = baseUrl.replace(/\/+$/, "");
  const q = `user_uuid=${encodeURIComponent(userUuid)}`;

  const summary = await safeFetch(`${base}/api/dashboard-summary?${q}`, token);
  let wishlist = await safeFetch(`${base}/wishlists?${q}`, token);
  if (!wishlist) wishlist = await safeFetch(`${base}/wishlist/forecast?${q}`, token);

  const cached = readCache();

  if (!summary && !wishlist) {
    if (cached) return cached;
    return {
      income: 0, expense: 0, fixedBudget: 0, remainingBudget: 0,
      updatedAt: null
    };
  }

  const c = cached || {};

  const income = summary
    ? e5ToAmount(summary.total_income_e5)
    : (c.income ?? 0);

  let expense = c.expense ?? 0;
  if (summary && typeof summary.total_expense_e5 === "number") {
    expense = e5ToAmount(summary.total_expense_e5);
  } else if (wishlist && typeof wishlist.cycle_expenses_e5 === "number") {
    expense = e5ToAmount(wishlist.cycle_expenses_e5);
  }

  const fixedBudget =
    wishlist && typeof wishlist.monthly_budget_e5 === "number"
      ? e5ToAmount(wishlist.monthly_budget_e5)
      : (c.fixedBudget ?? 0);

  const data = {
    income,
    expense,
    fixedBudget,
    remainingBudget: fixedBudget - expense,
    cycleStartDate: wishlist?.cycle_start_date ?? c.cycleStartDate,
    cycleEndDate: wishlist?.cycle_end_date ?? c.cycleEndDate,
    updatedAt: new Date().toISOString()
  };

  saveCache(data);
  return data;
}

// ==========================================
// UI
// ==========================================
function progressBar(width, height, pct, hex) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const r = height / 2;
  const track = new Path();
  track.addRoundedRect(new Rect(0, 0, width, height), r, r);
  ctx.addPath(track);
  ctx.setFillColor(new Color(THEME.white, 0.22));
  ctx.fillPath();

  if (pct > 0) {
    const w = Math.max(height, width * Math.min(pct, 1));
    const fill = new Path();
    fill.addRoundedRect(new Rect(0, 0, w, height), r, r);
    ctx.addPath(fill);
    ctx.setFillColor(new Color(hex));
    ctx.fillPath();
  }
  return ctx.getImage();
}

function addPill(parent, glyph, label, value, hex) {
  const pill = parent.addStack();
  pill.layoutVertically();
  pill.spacing = 1;
  pill.setPadding(6, 8, 6, 8);
  pill.cornerRadius = 12;
  pill.backgroundColor = new Color(THEME.white, 0.1);

  const row = pill.addStack();
  row.centerAlignContent();
  const g = row.addText(glyph);
  g.font = Font.heavySystemFont(8);
  g.textColor = new Color(hex);
  row.addSpacer(2);
  const l = row.addText(label);
  l.font = Font.boldSystemFont(8);
  l.textColor = new Color(THEME.white, ALPHA.secondary);

  const v = pill.addText(formatShort(value));
  v.font = rounded(13, false);
  v.textColor = new Color(THEME.white, ALPHA.primary);
  v.minimumScaleFactor = 0.7;
  v.lineLimit = 1;
}

function createWidget(data) {
  const widget = new ListWidget();
  widget.setPadding(15, 15, 13, 15);

  // Dropped by system in clear mode
  const g = new LinearGradient();
  g.colors = [new Color(THEME.bgTop), new Color(THEME.bgBottom)];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  widget.backgroundGradient = g;

  widget.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60 * 1000);

  const budget = data.fixedBudget || 0;
  const remaining = data.remainingBudget || 0;
  const over = remaining < 0;
  const low = !over && budget > 0 && remaining <= budget * 0.2;
  const pctSpent = budget > 0 ? data.expense / budget : 0;

  let accent = THEME.mint;
  let status = "LEFT TO SPEND";
  if (over) { accent = THEME.coral; status = "▲ OVER BUDGET"; }
  else if (low) { accent = THEME.peach; status = "● RUNNING LOW"; }

  // Header
  const head = widget.addStack();
  head.centerAlignContent();
  const title = head.addText("PENNE");
  title.font = Font.heavySystemFont(10);
  title.textColor = new Color(THEME.white, ALPHA.secondary);
  head.addSpacer();
  const left = daysLeft(data.cycleEndDate);
  if (left !== null) {
    const tag = head.addText(left === 1 ? "1d left" : `${left}d left`);
    tag.font = Font.semiboldSystemFont(9);
    tag.textColor = new Color(THEME.white, ALPHA.secondary);
  }

  widget.addSpacer(8);

  // Hero
  const cap = widget.addText(status);
  cap.font = Font.boldSystemFont(8);
  cap.textColor = new Color(THEME.white, ALPHA.secondary);

  widget.addSpacer(1);

  const hero = widget.addText(formatINR(remaining));
  hero.font = rounded(28, true);
  hero.textColor = new Color(accent);
  hero.minimumScaleFactor = 0.5;
  hero.lineLimit = 1;

  widget.addSpacer(5);

  if (budget > 0) {
    const bar = widget.addImage(progressBar(260, 10, pctSpent, accent));
    bar.imageSize = new Size(126, 5);
    widget.addSpacer(3);
    const sub = widget.addText(
      `${Math.round(pctSpent * 100)}% of ${formatShort(budget)} used`
    );
    sub.font = Font.mediumSystemFont(8);
    sub.textColor = new Color(THEME.white, ALPHA.tertiary);
    sub.lineLimit = 1;
    sub.minimumScaleFactor = 0.8;
  }

  widget.addSpacer();

  // Footer pills
  const foot = widget.addStack();
  foot.layoutHorizontally();
  foot.spacing = 6;
  addPill(foot, "↓", "IN", data.income, THEME.mint);
  addPill(foot, "↑", "OUT", data.expense, THEME.coral);

  return widget;
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  let baseUrl = BASE_URL;
  let userUuid = USER_UUID;
  let token = BEARER_TOKEN;

  const param = args.widgetParameter || args.shortcutParameter;
  if (param) {
    try {
      const input = typeof param === "string" ? JSON.parse(param) : param;
      if (input.baseUrl) baseUrl = input.baseUrl;
      if (input.userUuid) userUuid = input.userUuid;
      if (input.token) token = input.token;
    } catch (e) {
      console.log("Param not JSON, using defaults.");
    }
  }

  const data = await loadData(baseUrl, userUuid, token);
  const widget = createWidget(data);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentSmall();
  }

  Script.complete();
}

await main();