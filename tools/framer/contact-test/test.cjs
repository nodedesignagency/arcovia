// Investor path test. Every request to Airtable is caught and answered here; nothing leaves the machine for it.
const { chromium } = require("playwright");
const fs = require("fs");
const [, , base, outDir, scenario] = process.argv;
const ALLOW = /^(https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/|https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|framerusercontent\.com)\/)/;
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const caught = [], blocked = [];
  await context.route("**/*", async (route) => {
    const req = route.request(), url = req.url();
    let host = ""; try { host = new URL(url).hostname; } catch (e) {}
    if (/(^|\.)airtable\.com$/i.test(host)) {
      caught.push({ method: req.method(), url, headers: req.headers(), body: req.postData() });
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
    }
    if (ALLOW.test(url) || url.startsWith("data:")) return route.continue();
    blocked.push(url); return route.abort();
  });
  const page = await context.newPage();
  const logs = []; page.on("console", (m) => logs.push(m.type() + ": " + m.text())); page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  const endpoint = process.env.CONTACT_ENDPOINT || "";
  await page.goto(base + "/index.html" + (endpoint ? "?endpoint=" + encodeURIComponent(endpoint) : ""), { waitUntil: "networkidle" });
  await page.waitForSelector("form.note-form");
  await page.locator("label.note-path", { hasText: "I’m an investor" }).click();
  await page.waitForTimeout(400);
  const fields = await page.$$eval("form.note-form [name]", (els) => els.filter((e) => !e.disabled && e.type !== "hidden" && e.getClientRects().length).map((e) => ({ name: e.name, type: e.type || e.tagName.toLowerCase(), required: e.required, value: e.value, label: e.getAttribute("aria-label") || (e.closest("label") ? e.closest("label").textContent.trim().slice(0, 40) : "") })));
  const fill = async (name, value) => { const el = page.locator(`form.note-form [name="${name}"]:enabled`).first(); await el.fill(value); };
  if (scenario !== "empty") {
    await page.selectOption('form.note-form select[name="investor_type"]', "Corporate VC");
    await fill("check_size", "$1–5M");
    await page.locator('form.note-form .note-stages label.note-path', { hasText: /^Seed$/ }).click();
    await page.locator('form.note-form .note-stages label.note-path', { hasText: "Series A" }).click();
    await fill("sectors", "fintech and AI infrastructure");
    await fill("geographies", "the US and Latin America");
    await fill("us_state", "California and New York");
    await fill("business_model", "B2B SaaS");
  }
  // The rest of the note: any required blank still empty gets a plain test value
  for (const f of await page.$$eval("form.note-form [name]", (els) => els.filter((e) => !e.disabled && e.type !== "hidden" && e.getClientRects().length && e.required).map((e) => ({ name: e.name, type: e.type, tag: e.tagName, value: e.value })))) {
    if (f.type === "checkbox") { await page.locator(`form.note-form [name="${f.name}"]`).first().check({ force: true }); continue; }
    if (f.type === "radio" || f.value) continue;
    if (f.tag === "SELECT") { const v = await page.$eval(`form.note-form select[name="${f.name}"]`, (s) => [...s.options].find((o) => o.value)?.value); await page.selectOption(`form.note-form select[name="${f.name}"]`, v); continue; }
    await fill(f.name, f.type === "email" ? "test.investor@example.com" : f.name === "full_name" ? "Test Investor" : "Test " + f.name.replace(/_/g, " "));
  }
  await page.waitForTimeout(300);
  const note = page.locator("form.note-form .note");
  await note.screenshot({ path: `${outDir}/investor-${scenario}-filled.png` });
  await page.locator('form.note-form [type="submit"]').click();
  await page.waitForTimeout(1500);
  const doneVisible = await page.$eval("[data-contact-done]", (d) => !d.hidden).catch(() => null);
  const status = await page.$eval("[data-status]", (s) => s.textContent).catch(() => null);
  if (doneVisible) await page.locator("[data-contact-done]").screenshot({ path: `${outDir}/investor-${scenario}-thanks.png` });
  const payloads = caught.map((c) => ({ method: c.method, url: c.url, contentType: c.headers["content-type"], fields: Object.fromEntries(new URLSearchParams(c.body || "")) }));
  fs.writeFileSync(`${outDir}/investor-${scenario}.json`, JSON.stringify({ fields, payloads, blocked, doneVisible, status, logs }, null, 2));
  console.log(JSON.stringify({ scenario, requestsCaught: caught.length, blocked, doneVisible, status, errors: logs.filter((l) => /error/i.test(l)) }));
  const sent = payloads[0] ? payloads[0].fields : {};
  for (const k of ["tag", "investor_type", "check_size", "stages", "sectors", "geographies", "us_state", "business_model"]) console.log(`  ${k.padEnd(15)} ${k in sent ? JSON.stringify(sent[k]) : "MISSING"}`);
  console.log("  details:\n    " + String(sent.details || "").replace(/\n/g, "\n    "));
  await browser.close();
})();
