const STORAGE_KEY = "automation_studio_items";
const SETTINGS_KEY = "automation_studio_settings";

const STAGES = [
  { id: "queued", progress: 15 },
  { id: "collecting", progress: 40 },
  { id: "analyzing", progress: 70 },
  { id: "sending", progress: 90 },
  { id: "done", progress: 100 },
];

const I18N = {
  he: {
    lang: "he",
    dir: "rtl",
    eyebrow: "סטודיו אוטומציות",
    heroTitle: "בנה אוטומציות בטקסט חופשי",
    heroSubtitle: "כתוב מה אתה רוצה לאוטומט, קבל תוכנית עבודה, ושמור את הכל במקום אחד.",
    tabCreate: "יצירה",
    tabDashboard: "האוטומציות שלי",
    tabSettings: "הגדרות",
    composerTitle: "יצירת אוטומציה חדשה",
    createButton: "Create New Automation",
    titleLabel: "שם האוטומציה",
    emailLabel: "אימייל לקבלת עדכונים",
    promptLabel: "מה האוטומציה צריכה לעשות?",
    previewTitle: "תוכנית אוטומציה שנוצרה",
    saveButton: "שמירת אוטומציה",
    dashboardTitle: "כל האוטומציות והשלב הנוכחי",
    settingsTitle: "הגדרות",
    languageTitle: "שפה",
    languageDescription: "החלפה מהירה בין עברית ואנגלית",
    themeTitle: "ערכת צבעים",
    themeDescription: "הפעל/כבה מצב כהה (Dark Mode)",
    langToggleEnglish: "Switch to English",
    langToggleHebrew: "עברית",
    themeToggleDark: "הפעל מצב כהה",
    themeToggleLight: "עבור למצב בהיר",
    placeholderTitle: "למשל: סיכום שוק הון יומי",
    placeholderEmail: "you@example.com",
    placeholderPrompt:
      "כל יום בשעה 7 בבוקר תעבור על חדשות שוק ההון הגלובליות, תסכם את החדשות החשובות, ותשלח לי במייל.",
    noAutomations: "עדיין אין אוטומציות. צור את הראשונה שלך במסך יצירה.",
    scheduleLabel: "תדירות",
    emailDelivery: "שליחה ל",
    statusNow: "שלב נוכחי",
    statusSelectLabel: "עדכון שלב",
    stage_queued: "בתור",
    stage_collecting: "איסוף מידע",
    stage_analyzing: "ניתוח",
    stage_sending: "שליחה",
    stage_done: "הושלם",
    scheduleDaily: "יומי",
    scheduleWeekly: "שבועי",
    scheduleMonthly: "חודשי",
    scheduleCustom: "מותאם אישית",
    steps: {
      trigger: "הפעלת האוטומציה לפי התזמון שביקשת.",
      collect: "איסוף מידע רלוונטי לבקשה שלך.",
      analyze: "ניתוח הנתונים עם AI והפקת תובנות חשובות.",
      deliver: "יצירת סיכום קצר ושליחה למייל שבחרת.",
    },
  },
  en: {
    lang: "en",
    dir: "ltr",
    eyebrow: "Automation Studio",
    heroTitle: "Build automations in plain language",
    heroSubtitle: "Describe what to automate, get a clear workflow plan, and track everything in one place.",
    tabCreate: "Create",
    tabDashboard: "My Automations",
    tabSettings: "Settings",
    composerTitle: "Create New Automation",
    createButton: "Create New Automation",
    titleLabel: "Automation title",
    emailLabel: "Notification email",
    promptLabel: "What should this automation do?",
    previewTitle: "Generated automation plan",
    saveButton: "Save Automation",
    dashboardTitle: "All automations and current stage",
    settingsTitle: "Settings",
    languageTitle: "Language",
    languageDescription: "Quickly switch between Hebrew and English",
    themeTitle: "Theme",
    themeDescription: "Turn Dark Mode on or off",
    langToggleEnglish: "English",
    langToggleHebrew: "עבור לעברית",
    themeToggleDark: "Enable Dark Mode",
    themeToggleLight: "Switch to Light Mode",
    placeholderTitle: "Example: Daily Market Brief",
    placeholderEmail: "you@example.com",
    placeholderPrompt:
      "Every day at 7 AM, review global capital market news, summarize key updates, and send me an email digest.",
    noAutomations: "No automations yet. Create your first one in the Create tab.",
    scheduleLabel: "Schedule",
    emailDelivery: "Delivery to",
    statusNow: "Current stage",
    statusSelectLabel: "Update stage",
    stage_queued: "Queued",
    stage_collecting: "Collecting data",
    stage_analyzing: "Analyzing",
    stage_sending: "Sending",
    stage_done: "Done",
    scheduleDaily: "Daily",
    scheduleWeekly: "Weekly",
    scheduleMonthly: "Monthly",
    scheduleCustom: "Custom",
    steps: {
      trigger: "Trigger the automation based on your requested schedule.",
      collect: "Collect relevant data for your request.",
      analyze: "Run AI analysis to identify meaningful insights.",
      deliver: "Generate a concise summary and deliver it to your email.",
    },
  },
};

const state = {
  settings: loadSettings(),
  draftAutomation: null,
};

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
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaults;

  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function t(key) {
  return I18N[state.settings.language][key];
}

function stageText(stageId) {
  return t(`stage_${stageId}`);
}

function scheduleText(schedule) {
  if (schedule === "Daily") return t("scheduleDaily");
  if (schedule === "Weekly") return t("scheduleWeekly");
  if (schedule === "Monthly") return t("scheduleMonthly");
  return t("scheduleCustom");
}

function applyTheme() {
  document.body.dataset.theme = state.settings.theme;
}

function applyLanguage() {
  const langPack = I18N[state.settings.language];
  document.documentElement.lang = langPack.lang;
  document.documentElement.dir = langPack.dir;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = langPack[node.dataset.i18n];
  });

  document.querySelector("#automation-name").placeholder = langPack.placeholderTitle;
  document.querySelector("#email").placeholder = langPack.placeholderEmail;
  document.querySelector("#automation-prompt").placeholder = langPack.placeholderPrompt;

  langToggleButton.textContent = state.settings.language === "he" ? langPack.langToggleEnglish : langPack.langToggleHebrew;
  themeToggleButton.textContent = state.settings.theme === "dark" ? langPack.themeToggleLight : langPack.themeToggleDark;
}

function readFormValues() {
  const formData = new FormData(form);
  return {
    title: String(formData.get("automationName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    prompt: String(formData.get("automationPrompt") || "").trim(),
  };
}

function extractSchedule(promptText) {
  const lowered = promptText.toLowerCase();
  if (lowered.includes("every day") || lowered.includes("daily") || lowered.includes("כל יום")) return "Daily";
  if (lowered.includes("every week") || lowered.includes("weekly") || lowered.includes("כל שבוע")) return "Weekly";
  if (lowered.includes("every month") || lowered.includes("monthly") || lowered.includes("כל חודש")) return "Monthly";
  return "Custom";
}

function generateSteps() {
  return [t("steps").trigger, t("steps").collect, t("steps").analyze, t("steps").deliver];
}

function getStageProgress(stageId) {
  const found = STAGES.find((stage) => stage.id === stageId);
  return found ? found.progress : 0;
}

function renderPreview(item) {
  previewContent.innerHTML = "";
  const meta = document.createElement("div");
  meta.className = "plan-meta";
  meta.innerHTML = `
    <strong>${item.title}</strong>
    <span>${t("scheduleLabel")}: ${scheduleText(item.schedule)}</span>
    <span>${t("emailDelivery")}: ${item.email}</span>
  `;

  const steps = document.createElement("ol");
  steps.className = "plan-steps";
  item.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    steps.append(li);
  });

  previewContent.append(meta, steps);
  previewSection.classList.remove("hidden");
}

function loadAutomations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function persistAutomations(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function saveDraft() {
  if (!state.draftAutomation) return;
  const existing = loadAutomations();
  existing.unshift(state.draftAutomation);
  persistAutomations(existing);
  state.draftAutomation = null;
  previewSection.classList.add("hidden");
  form.reset();
  renderSavedItems();
  activateTab("dashboard");
}

function updateStage(itemId, stageId) {
  const items = loadAutomations().map((item) => (item.id === itemId ? { ...item, stage: stageId } : item));
  persistAutomations(items);
  renderSavedItems();
}

function renderSavedItems() {
  const items = loadAutomations();
  savedList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = t("noAutomations");
    savedList.append(empty);
    return;
  }

  items.forEach((item) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector("h3").textContent = item.title;
    clone.querySelector(".schedule-badge").textContent = scheduleText(item.schedule);
    clone.querySelector(".saved-item-email").textContent = `${t("emailDelivery")}: ${item.email}`;
    clone.querySelector(".status-title").textContent = `${t("statusNow")}: ${stageText(item.stage || "queued")}`;

    const progress = getStageProgress(item.stage || "queued");
    clone.querySelector(".status-percent").textContent = `${progress}%`;
    clone.querySelector(".progress-fill").style.width = `${progress}%`;

    const statusLabel = clone.querySelector(".status-select-label span");
    statusLabel.textContent = t("statusSelectLabel");

    const select = clone.querySelector(".status-select");
    STAGES.forEach((stage) => {
      const option = document.createElement("option");
      option.value = stage.id;
      option.textContent = stageText(stage.id);
      option.selected = (item.stage || "queued") === stage.id;
      select.append(option);
    });

    select.addEventListener("change", () => updateStage(item.id, select.value));

    const stepsRoot = clone.querySelector(".steps");
    item.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsRoot.append(li);
    });

    savedList.append(clone);
  });
}

function activateTab(tabName) {
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tabTarget === tabName));
  tabPanels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.tabPanel !== tabName));
}

createButton.addEventListener("click", () => {
  if (!form.reportValidity()) return;

  const values = readFormValues();
  state.draftAutomation = {
    id: crypto.randomUUID(),
    title: values.title,
    email: values.email,
    prompt: values.prompt,
    schedule: extractSchedule(values.prompt),
    steps: generateSteps(),
    stage: "queued",
    createdAt: new Date().toISOString(),
  };

  renderPreview(state.draftAutomation);
});

saveButton.addEventListener("click", saveDraft);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
});

langToggleButton.addEventListener("click", () => {
  state.settings.language = state.settings.language === "he" ? "en" : "he";
  saveSettings();
  applyLanguage();
  renderSavedItems();
  if (state.draftAutomation) {
    state.draftAutomation.steps = generateSteps();
    renderPreview(state.draftAutomation);
  }
});

themeToggleButton.addEventListener("click", () => {
  state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
  saveSettings();
  applyTheme();
  applyLanguage();
});

applyTheme();
applyLanguage();
renderSavedItems();
