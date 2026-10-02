// Variables used by Scriptable.
// These must be at the top of the file to be recognized by Scriptable.
// icon-color: purple; icon-glyph: chart-pie;

/**
 * Penne Budget & Financial Summary Widget for iOS (Scriptable)
 *
 * Designed for iOS Scriptable Small (Square) Widget.
 * Displays three core financial metrics listed one by one:
 *   1. Income (Authoritative monthly / cycle income)
 *   2. Expenses (Authoritative monthly / cycle debit spend)
 *   3. Remaining Budget (Uses user's fixed monthly budget from Wishlist/Settings minus expenses)
 *
 * API Endpoints Hit:
 *   - GET /api/dashboard-summary?user_uuid={uuid} (Income & Expenses)
 *   - GET /wishlists?user_uuid={uuid} (Fixed Monthly Budget & Cycle Expense Surplus)
 *     (with fallback to /wishlist/forecast?user_uuid={uuid})
 */

// ==========================================
// CONFIGURATION
// ==========================================
// Base URL of your Penne backend server (e.g. ngrok tunnel or LAN IP)
const BASE_URL = "https://yak-crisp-vulture.ngrok-free.app/";

// Test/User credentials (matches default Penne user session)
const USER_UUID = "f66dcebd-e275-4b22-83bd-e446e0a45624";
const BEARER_TOKEN = "78504dcf-6683-4acc-84ae-417bd41ae6bc";

// Velvet Theme Color Palette
const THEME = {
  bgTop: "#1A1735",
  bgBottom: "#0F0D24",
  cardBg: "rgba(255, 255, 255, 0.04)",
  textWhite: "#F5F3FF",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  mint: "#A8E6CF",     // Income & positive remaining
  coral: "#FFB5A7",    // Expenses & deficit
  peach: "#FBD8B3",    // Budget accent
  lavender: "#C8B6FF"  // Secondary highlight
};

// ==========================================
// CACHE HELPERS (Offline Resilience)
// ==========================================
const CACHE_FILE = "penne_budget_widget_cache.json";

function getCachePath() {
  const fm = FileManager.local();
  return fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
}

function saveCache(data) {
  try {
    const fm = FileManager.local();
    fm.writeString(getCachePath(), JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to write cache: " + err);
  }
}

function readCache() {
  try {
    const fm = FileManager.local();
    const path = getCachePath();
    if (fm.fileExists(path)) {
      return JSON.parse(fm.readString(path));
    }
  } catch (err) {
    console.warn("Failed to read cache: " + err);
  }
  return null;
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  return `${isNegative ? "-" : ""}₹${absVal.toLocaleString("en-IN")}`;
}

function e5ToAmount(e5) {
  if (typeof e5 !== "number" || isNaN(e5)) return 0;
  return e5 / 100000;
}

// ==========================================
// API CLIENT
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

async function loadData(baseUrl, userUuid, token) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const summaryUrl = `${cleanBase}/api/dashboard-summary?user_uuid=${encodeURIComponent(userUuid)}`;
  const wishlistUrl = `${cleanBase}/wishlists?user_uuid=${encodeURIComponent(userUuid)}`;
  const forecastFallbackUrl = `${cleanBase}/wishlist/forecast?user_uuid=${encodeURIComponent(userUuid)}`;

  let summaryData = null;
  let wishlistData = null;
  let networkFailed = false;

  // 1. Fetch dashboard summary (authoritative income & spend)
  try {
    summaryData = await fetchEndpoint(summaryUrl, token);
  } catch (err) {
    console.warn(`Error fetching dashboard summary: ${err.message || err}`);
    networkFailed = true;
  }

  // 2. Fetch wishlist forecast (authoritative user-fixed budget)
  try {
    wishlistData = await fetchEndpoint(wishlistUrl, token);
  } catch (err) {
    console.warn(`Error fetching wishlists: ${err.message || err}, trying forecast fallback...`);
    try {
      wishlistData = await fetchEndpoint(forecastFallbackUrl, token);
    } catch (fallbackErr) {
      console.warn(`Error fetching wishlist forecast: ${fallbackErr.message || fallbackErr}`);
      networkFailed = true;
    }
  }

  // If live network succeeded for at least one, calculate and update cache
  if (summaryData || wishlistData) {
    const incomeE5 = summaryData?.total_income_e5 ?? 0;
    const expenseE5 = summaryData?.total_expense_e5 ?? wishlistData?.cycle_expenses_e5 ?? 0;
    const fixedBudgetE5 = wishlistData?.monthly_budget_e5 ?? 0;

    const parsedData = {
      income: e5ToAmount(incomeE5),
      expense: e5ToAmount(expenseE5),
      fixedBudget: e5ToAmount(fixedBudgetE5),
      // Budget fixed by user minus current expenses (per user requirement)
      remainingBudget: e5ToAmount(fixedBudgetE5) - e5ToAmount(expenseE5),
      cycleStartDate: wishlistData?.cycle_start_date,
      cycleEndDate: wishlistData?.cycle_end_date,
      updatedAt: new Date().toISOString(),
      isOffline: false
    };

    saveCache(parsedData);
    return parsedData;
  }

  // If both live network requests failed, fall back to offline cache
  const cached = readCache();
  if (cached) {
    cached.isOffline = true;
    return cached;
  }

  // Return zeroed fallback if no cache exists
  return {
    income: 0,
    expense: 0,
    fixedBudget: 0,
    remainingBudget: 0,
    updatedAt: null,
    isOffline: true,
    hasError: true
  };
}

// ==========================================
// WIDGET UI BUILDER
// ==========================================
function createWidget(data) {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);

  // Velvet theme background gradient
  const gradient = new LinearGradient();
  gradient.colors = [new Color(THEME.bgTop), new Color(THEME.bgBottom)];
  gradient.locations = [0.0, 1.0];
  widget.backgroundGradient = gradient;

  // Header Row: App name & Status / Cycle Tag
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  const titleText = headerStack.addText("PENNE");
  titleText.font = Font.heavySystemFont(10);
  titleText.textColor = new Color(THEME.textMuted);

  headerStack.addSpacer();

  const badgeText = headerStack.addText(data.isOffline ? "OFFLINE" : "BUDGET");
  badgeText.font = Font.boldSystemFont(8);
  badgeText.textColor = data.isOffline ? new Color(THEME.coral) : new Color(THEME.lavender);

  widget.addSpacer(5);

  // 1. INCOME BLOCK
  const incomeStack = widget.addStack();
  incomeStack.layoutVertically();
  incomeStack.spacing = 1;

  const incomeLabelStack = incomeStack.addStack();
  incomeLabelStack.layoutHorizontally();
  incomeLabelStack.centerAlignContent();

  const incomeDot = incomeLabelStack.addText("● ");
  incomeDot.font = Font.systemFont(7);
  incomeDot.textColor = new Color(THEME.mint);

  const incomeLabel = incomeLabelStack.addText("INCOME");
  incomeLabel.font = Font.boldSystemFont(9);
  incomeLabel.textColor = new Color(THEME.textMuted);

  const incomeVal = incomeStack.addText(formatINR(data.income));
  incomeVal.font = Font.boldSystemFont(13);
  incomeVal.textColor = new Color(THEME.mint);

  widget.addSpacer(4);

  // 2. EXPENSE BLOCK
  const expenseStack = widget.addStack();
  expenseStack.layoutVertically();
  expenseStack.spacing = 1;

  const expenseLabelStack = expenseStack.addStack();
  expenseLabelStack.layoutHorizontally();
  expenseLabelStack.centerAlignContent();

  const expenseDot = expenseLabelStack.addText("● ");
  expenseDot.font = Font.systemFont(7);
  expenseDot.textColor = new Color(THEME.coral);

  const expenseLabel = expenseLabelStack.addText("EXPENSE");
  expenseLabel.font = Font.boldSystemFont(9);
  expenseLabel.textColor = new Color(THEME.textMuted);

  const expenseVal = expenseStack.addText(formatINR(data.expense));
  expenseVal.font = Font.boldSystemFont(13);
  expenseVal.textColor = new Color(THEME.coral);

  widget.addSpacer(4);

  // 3. REMAINING BUDGET BLOCK (fixed budget - expense)
  const remainingStack = widget.addStack();
  remainingStack.layoutVertically();
  remainingStack.spacing = 1;

  const remainingLabelStack = remainingStack.addStack();
  remainingLabelStack.layoutHorizontally();
  remainingLabelStack.centerAlignContent();

  const isOverBudget = data.remainingBudget < 0;
  const remainingColor = isOverBudget
    ? new Color(THEME.coral)
    : (data.remainingBudget > (data.fixedBudget * 0.2)
      ? new Color(THEME.mint)
      : new Color(THEME.peach));

  const remainingDot = remainingLabelStack.addText("● ");
  remainingDot.font = Font.systemFont(7);
  remainingDot.textColor = remainingColor;

  const remainingLabel = remainingLabelStack.addText("REMAINING BUDGET");
  remainingLabel.font = Font.boldSystemFont(9);
  remainingLabel.textColor = new Color(THEME.peach);

  const remainingVal = remainingStack.addText(formatINR(data.remainingBudget));
  remainingVal.font = Font.heavySystemFont(14);
  remainingVal.textColor = remainingColor;

  // Context footer: show fixed budget reference if set
  if (data.fixedBudget > 0) {
    const budgetContext = remainingStack.addText(`of ${formatINR(data.fixedBudget)} budget`);
    budgetContext.font = Font.systemFont(7);
    budgetContext.textColor = new Color(THEME.textDim);
  }

  return widget;
}

// ==========================================
// MAIN EXECUTION
// ==========================================
async function main() {
  let baseUrl = BASE_URL;
  let userUuid = USER_UUID;
  let token = BEARER_TOKEN;

  // Allow dynamic parameter overrides from iOS Widget settings or Apple Shortcuts
  const param = args.widgetParameter || args.shortcutParameter;
  if (param) {
    try {
      const input = typeof param === "string" ? JSON.parse(param) : param;
      if (input.baseUrl) baseUrl = input.baseUrl;
      if (input.userUuid) userUuid = input.userUuid;
      if (input.token) token = input.token;
    } catch (e) {
      console.log("Parameter is not JSON, continuing with default configuration.");
    }
  }

  const data = await loadData(baseUrl, userUuid, token);
  const widget = createWidget(data);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // Present small (square) widget for testing inside Scriptable app
    await widget.presentSmall();
  }

  Script.complete();
}

await main();
