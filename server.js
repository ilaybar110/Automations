import express from "express";
import cron from "node-cron";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_PATH = path.join(process.cwd(), "data", "automations.json");

app.use(express.json());
app.use(express.static(process.cwd()));

const stages = ["queued", "collecting", "analyzing", "sending", "done", "failed"];
const stageProgress = { queued: 15, collecting: 40, analyzing: 70, sending: 90, done: 100, failed: 100 };

const jobs = new Map();

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, "[]", "utf8");
  }
}

async function readAutomations() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeAutomations(items) {
  await ensureDataFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), "utf8");
}

function parseTime(prompt) {
  const m = prompt.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return { hour: 7, minute: 0 };
  return { hour: Math.min(23, Number(m[1])), minute: Math.min(59, Number(m[2])) };
}

function scheduleType(prompt) {
  const t = prompt.toLowerCase();
  if (t.includes("every day") || t.includes("daily") || t.includes("כל יום")) return "daily";
  if (t.includes("every week") || t.includes("weekly") || t.includes("כל שבוע")) return "weekly";
  return "daily";
}

function formatCron(item) {
  const { hour, minute } = parseTime(item.prompt || "");
  if (item.schedule === "weekly") return `${minute} ${hour} * * 1`;
  return `${minute} ${hour} * * *`;
}

function makeTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function updateStage(id, stage, message) {
  const items = await readAutomations();
  const next = items.map((item) => (item.id === id ? { ...item, stage, progress: stageProgress[stage], lastRunMessage: message || item.lastRunMessage, updatedAt: new Date().toISOString() } : item));
  await writeAutomations(next);
}

async function fetchNewsDigest() {
  const res = await fetch("https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EDJI,%5EIXIC&region=US&lang=en-US");
  const xml = await res.text();
  const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)].map((m) => m[1]).slice(1, 6);
  if (!titles.length) return "No major updates found.";
  return titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

async function runAutomation(id) {
  const items = await readAutomations();
  const item = items.find((a) => a.id === id);
  if (!item || !item.enabled) return;

  try {
    await updateStage(id, "collecting", "Collecting market headlines.");
    const digest = await fetchNewsDigest();

    await updateStage(id, "analyzing", "Summarizing headlines.");
    const summary = `Automation: ${item.title}\n\nPrompt: ${item.prompt}\n\nTop market updates:\n${digest}`;

    await updateStage(id, "sending", "Sending email.");
    const transporter = makeTransporter();

    if (!transporter) {
      await updateStage(id, "failed", "SMTP is not configured. Set SMTP_* environment variables.");
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: item.email,
      subject: `[Automation] ${item.title}`,
      text: summary,
    });

    await updateStage(id, "done", "Email sent successfully.");
  } catch (error) {
    await updateStage(id, "failed", `Run failed: ${error.message}`);
  }
}

function registerJob(item) {
  if (jobs.has(item.id)) {
    jobs.get(item.id).stop();
    jobs.delete(item.id);
  }

  if (!item.enabled) return;

  const expression = formatCron(item);
  const job = cron.schedule(expression, () => runAutomation(item.id), { timezone: process.env.TZ || "Asia/Jerusalem" });
  jobs.set(item.id, job);
}

async function hydrateJobs() {
  const items = await readAutomations();
  items.forEach(registerJob);
}

app.get("/api/automations", async (_, res) => {
  const items = await readAutomations();
  res.json(items);
});

app.post("/api/automations", async (req, res) => {
  const { title, email, prompt } = req.body;
  if (!title || !email || !prompt) return res.status(400).json({ error: "title, email and prompt are required" });

  const schedule = scheduleType(prompt);
  const item = {
    id: crypto.randomUUID(),
    title,
    email,
    prompt,
    schedule,
    stage: "queued",
    progress: 15,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRunMessage: "Waiting for next trigger.",
  };

  const items = await readAutomations();
  items.unshift(item);
  await writeAutomations(items);
  registerJob(item);
  res.status(201).json(item);
});

app.patch("/api/automations/:id", async (req, res) => {
  const { id } = req.params;
  const { stage, enabled } = req.body;
  const items = await readAutomations();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  if (stage && stages.includes(stage)) {
    items[idx].stage = stage;
    items[idx].progress = stageProgress[stage];
  }

  if (typeof enabled === "boolean") items[idx].enabled = enabled;
  items[idx].updatedAt = new Date().toISOString();

  await writeAutomations(items);
  registerJob(items[idx]);
  res.json(items[idx]);
});

app.post("/api/automations/:id/run-now", async (req, res) => {
  runAutomation(req.params.id);
  res.json({ ok: true });
});

app.get("*", (_, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

await hydrateJobs();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
