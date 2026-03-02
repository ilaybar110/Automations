const STORAGE_KEY = "automation_studio_items";

const createButton = document.querySelector("#create-btn");
const saveButton = document.querySelector("#save-btn");
const form = document.querySelector("#automation-form");
const previewSection = document.querySelector("#preview");
const previewContent = document.querySelector("#preview-content");
const savedList = document.querySelector("#saved-list");
const template = document.querySelector("#saved-item-template");

let draftAutomation = null;

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

  if (lowered.includes("every day") || lowered.includes("daily")) {
    return "Daily";
  }

  if (lowered.includes("every week") || lowered.includes("weekly")) {
    return "Weekly";
  }

  if (lowered.includes("every month") || lowered.includes("monthly")) {
    return "Monthly";
  }

  return "Custom";
}

function generateSteps(promptText, email) {
  const cleaned = promptText.replace(/\s+/g, " ").trim();

  return [
    "Trigger automation based on your requested schedule.",
    `Collect relevant data required for: \"${cleaned}\".`,
    "Run AI analysis to identify the most meaningful insights.",
    `Generate a concise summary and deliver it to ${email}.`,
  ];
}

function renderPreview(item) {
  previewContent.innerHTML = "";

  const meta = document.createElement("div");
  meta.className = "plan-meta";
  meta.innerHTML = `
    <strong>${item.title}</strong>
    <span>Schedule: ${item.schedule}</span>
    <span>Email delivery: ${item.email}</span>
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

function saveDraft() {
  if (!draftAutomation) {
    return;
  }

  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  existing.unshift(draftAutomation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  draftAutomation = null;
  previewSection.classList.add("hidden");
  form.reset();
  renderSavedItems();
}

function renderSavedItems() {
  const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  savedList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No automations yet. Create your first one above.";
    savedList.append(empty);
    return;
  }

  items.forEach((item) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector("h3").textContent = item.title;
    clone.querySelector(".badge").textContent = item.schedule;
    clone.querySelector(".saved-item-email").textContent = `Delivery: ${item.email}`;

    const stepsRoot = clone.querySelector(".steps");
    item.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsRoot.append(li);
    });

    savedList.append(clone);
  });
}

createButton.addEventListener("click", () => {
  if (!form.reportValidity()) {
    return;
  }

  const values = readFormValues();
  draftAutomation = {
    id: crypto.randomUUID(),
    title: values.title,
    email: values.email,
    prompt: values.prompt,
    schedule: extractSchedule(values.prompt),
    steps: generateSteps(values.prompt, values.email),
    createdAt: new Date().toISOString(),
  };

  renderPreview(draftAutomation);
});

saveButton.addEventListener("click", saveDraft);

renderSavedItems();
