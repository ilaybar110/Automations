const SETTINGS_KEY = "automation_studio_settings";

const STAGES = [
  { id: "queued", progress: 15 },
  { id: "collecting", progress: 40 },
  { id: "analyzing", progress: 70 },
  { id: "sending", progress: 90 },
  { id: "done", progress: 100 },
  { id: "failed", progress: 100 },
];

const I18N = {
  he: {
    lang: "he", dir: "rtl", eyebrow: "סטודיו אוטומציות", heroTitle: "בנה אוטומציות בטקסט חופשי",
    heroSubtitle: "עכשיו עם טריגר אמיתי בשרת ושליחה במייל דרך SMTP.", tabCreate: "יצירה", tabDashboard: "האוטומציות שלי", tabSettings: "הגדרות",
    composerTitle: "יצירת אוטומציה חדשה", createButton: "Create New Automation", titleLabel: "שם האוטומציה", emailLabel: "אימייל לקבלת עדכונים",
    promptLabel: "מה האוטומציה צריכה לעשות?", previewTitle: "תוכנית אוטומציה", saveButton: "שמור והפעל בשרת", dashboardTitle: "אוטומציות פעילות",
    settingsTitle: "הגדרות", languageTitle: "שפה", languageDescription: "החלפה בין עברית ואנגלית", themeTitle: "ערכת צבעים",
    themeDescription: "הפעל/כבה מצב כהה", langToggleEnglish: "Switch to English", langToggleHebrew: "עברית", themeToggleDark: "הפעל מצב כהה",
    themeToggleLight: "עבור למצב בהיר", placeholderTitle: "למשל: סיכום שוק הון יומי", placeholderEmail: "you@example.com",
    placeholderPrompt: "כל יום ב-15:30 תעבור על חדשות שוק ההון העולמי ותשלח לי סיכום במייל", noAutomations: "אין אוטומציות עדיין.",
    scheduleLabel: "תדירות", emailDelivery: "שליחה ל", statusNow: "שלב נוכחי", statusSelectLabel: "עדכון שלב", runNow: "הרץ עכשיו",
    stage_queued: "ממתין לטריגר", stage_collecting: "איסוף מידע", stage_analyzing: "ניתוח", stage_sending: "שליחה", stage_done: "הושלם", stage_failed: "נכשל",
    scheduleDaily: "יומי", scheduleWeekly: "שבועי", scheduleCustom: "מותאם", apiError: "שגיאה בשרת. ודא שהשרת רץ עם npm start",
    serverMode: "מצב שרת: אוטומציות רצות לפי שעה אמיתית.",
    steps: { trigger: "טריגר לפי שעה מהטקסט (למשל 15:30).", collect: "משיכת כותרות שוק ההון.", analyze: "ניתוח וסיכום.", deliver: "שליחה לאימייל דרך SMTP." },
  },
  en: {
    lang: "en", dir: "ltr", eyebrow: "Automation Studio", heroTitle: "Build automations in plain language",
    heroSubtitle: "Now with real server-side triggers and SMTP email delivery.", tabCreate: "Create", tabDashboard: "My Automations", tabSettings: "Settings",
    composerTitle: "Create New Automation", createButton: "Create New Automation", titleLabel: "Automation title", emailLabel: "Notification email",
    promptLabel: "What should this automation do?", previewTitle: "Automation plan", saveButton: "Save and enable on server", dashboardTitle: "Active automations",
    settingsTitle: "Settings", languageTitle: "Language", languageDescription: "Switch between Hebrew and English", themeTitle: "Theme",
    themeDescription: "Turn Dark Mode on or off", langToggleEnglish: "English", langToggleHebrew: "עברית", themeToggleDark: "Enable Dark Mode",
    themeToggleLight: "Switch to Light Mode", placeholderTitle: "Example: Daily Market Brief", placeholderEmail: "you@example.com",
    placeholderPrompt: "Every day at 15:30, review global capital market headlines and email me a summary", noAutomations: "No automations yet.",
    scheduleLabel: "Schedule", emailDelivery: "Delivery to", statusNow: "Current stage", statusSelectLabel: "Update stage", runNow: "Run now",
    stage_queued: "Waiting for trigger", stage_collecting: "Collecting", stage_analyzing: "Analyzing", stage_sending: "Sending", stage_done: "Done", stage_failed: "Failed",
    scheduleDaily: "Daily", scheduleWeekly: "Weekly", scheduleCustom: "Custom", apiError: "Server error. Make sure backend is running with npm start",
    serverMode: "Server mode: automations run at real scheduled time.",
    steps: { trigger: "Trigger by time extracted from text (e.g. 15:30).", collect: "Fetch market headlines.", analyze: "Analyze and summarize.", deliver: "Send to email through SMTP." },
  },
};

const state = { settings: loadSettings(), draftAutomation: null };
const createButton = document.querySelector("#create-btn");
const saveButton = document.querySelector("#save-btn");
const form = document.querySelector("#automation-form");
const previewSection = document.querySelector("#preview");
const previewContent = document.querySelector("#preview-content");
const savedList = document.querySelector("#saved-list");
const template = document.querySelector("#saved-item-template");
const langToggleButton = document.querySelector("#lang-toggle-btn");
const themeToggleButton = document.querySelector("#theme-toggle-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

function loadSettings() {
  const defaults = { language: "he", theme: "light" };
  try { return { ...defaults, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")) }; } catch { return defaults; }
}
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }
function t(key) { return I18N[state.settings.language][key]; }
function stageText(id) { return t(`stage_${id}`) || id; }
function scheduleText(s) { return s === "weekly" ? t("scheduleWeekly") : s === "daily" ? t("scheduleDaily") : t("scheduleCustom"); }

function applyTheme() { document.body.dataset.theme = state.settings.theme; }
function applyLanguage() {
  const pack = I18N[state.settings.language];
  document.documentElement.lang = pack.lang;
  document.documentElement.dir = pack.dir;
  document.querySelectorAll("[data-i18n]").forEach((n) => (n.textContent = pack[n.dataset.i18n]));
  document.querySelector("#automation-name").placeholder = pack.placeholderTitle;
  document.querySelector("#email").placeholder = pack.placeholderEmail;
  document.querySelector("#automation-prompt").placeholder = pack.placeholderPrompt;
  langToggleButton.textContent = state.settings.language === "he" ? pack.langToggleEnglish : pack.langToggleHebrew;
  themeToggleButton.textContent = state.settings.theme === "dark" ? pack.themeToggleLight : pack.themeToggleDark;
}

function readFormValues() {
  const d = new FormData(form);
  return { title: String(d.get("automationName") || "").trim(), email: String(d.get("email") || "").trim(), prompt: String(d.get("automationPrompt") || "").trim() };
}
function scheduleType(promptText) {
  const t1 = promptText.toLowerCase();
  if (t1.includes("every week") || t1.includes("weekly") || t1.includes("כל שבוע")) return "weekly";
  if (t1.includes("every day") || t1.includes("daily") || t1.includes("כל יום")) return "daily";
  return "daily";
}
function generateSteps() { return [t("steps").trigger, t("steps").collect, t("steps").analyze, t("steps").deliver]; }

function renderPreview(item) {
  previewContent.innerHTML = "";
  const meta = document.createElement("div");
  meta.className = "plan-meta";
  meta.innerHTML = `<strong>${item.title}</strong><span>${t("scheduleLabel")}: ${scheduleText(item.schedule)}</span><span>${t("emailDelivery")}: ${item.email}</span><span>${t("serverMode")}</span>`;
  const steps = document.createElement("ol");
  steps.className = "plan-steps";
  item.steps.forEach((s) => { const li = document.createElement("li"); li.textContent = s; steps.append(li); });
  previewContent.append(meta, steps);
  previewSection.classList.remove("hidden");
}

async function fetchAutomations() {
  const res = await fetch("/api/automations");
  if (!res.ok) throw new Error("api");
  return res.json();
}

async function createAutomation(payload) {
  const res = await fetch("/api/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("api");
  return res.json();
}

async function patchAutomation(id, patch) {
  const res = await fetch(`/api/automations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  if (!res.ok) throw new Error("api");
}

async function runNow(id) { await fetch(`/api/automations/${id}/run-now`, { method: "POST" }); }

async function saveDraft() {
  if (!state.draftAutomation) return;
  try {
    await createAutomation({ title: state.draftAutomation.title, email: state.draftAutomation.email, prompt: state.draftAutomation.prompt });
    state.draftAutomation = null;
    previewSection.classList.add("hidden");
    form.reset();
    await renderSavedItems();
    activateTab("dashboard");
  } catch {
    alert(t("apiError"));
  }
}

async function renderSavedItems() {
  savedList.innerHTML = "";
  let items = [];
  try { items = await fetchAutomations(); } catch { savedList.innerHTML = `<p class="empty-state">${t("apiError")}</p>`; return; }
  if (!items.length) { savedList.innerHTML = `<p class="empty-state">${t("noAutomations")}</p>`; return; }

  items.forEach((item) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector("h3").textContent = item.title;
    clone.querySelector(".schedule-badge").textContent = scheduleText(item.schedule);
    clone.querySelector(".saved-item-email").textContent = `${t("emailDelivery")}: ${item.email}`;
    clone.querySelector(".status-title").textContent = `${t("statusNow")}: ${stageText(item.stage || "queued")}`;
    clone.querySelector(".status-percent").textContent = `${item.progress || 0}%`;
    clone.querySelector(".progress-fill").style.width = `${item.progress || 0}%`;

    const label = clone.querySelector(".status-select-label span");
    label.textContent = t("statusSelectLabel");
    const select = clone.querySelector(".status-select");
    STAGES.forEach((stage) => {
      const option = document.createElement("option");
      option.value = stage.id;
      option.textContent = stageText(stage.id);
      option.selected = item.stage === stage.id;
      select.append(option);
    });
    select.addEventListener("change", async () => { await patchAutomation(item.id, { stage: select.value }); await renderSavedItems(); });

    const runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "secondary-btn";
    runBtn.textContent = t("runNow");
    runBtn.addEventListener("click", async () => { await runNow(item.id); setTimeout(renderSavedItems, 800); });

    const info = document.createElement("p");
    info.className = "saved-item-email";
    info.textContent = item.lastRunMessage || "";

    clone.querySelector(".steps").replaceWith(document.createElement("ul"));
    clone.querySelector(".status-select-label").after(runBtn, info);
    savedList.append(clone);
  });
}

function activateTab(tab) {
  tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tabTarget === tab));
  tabPanels.forEach((p) => p.classList.toggle("hidden", p.dataset.tabPanel !== tab));
}

createButton.addEventListener("click", () => {
  if (!form.reportValidity()) return;
  const values = readFormValues();
  state.draftAutomation = { ...values, schedule: scheduleType(values.prompt), steps: generateSteps() };
  renderPreview(state.draftAutomation);
});
saveButton.addEventListener("click", saveDraft);

tabButtons.forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tabTarget)));
langToggleButton.addEventListener("click", async () => { state.settings.language = state.settings.language === "he" ? "en" : "he"; saveSettings(); applyLanguage(); await renderSavedItems(); });
themeToggleButton.addEventListener("click", () => { state.settings.theme = state.settings.theme === "light" ? "dark" : "light"; saveSettings(); applyTheme(); applyLanguage(); });

applyTheme();
applyLanguage();
renderSavedItems();
setInterval(renderSavedItems, 30000);
