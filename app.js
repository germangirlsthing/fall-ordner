// CONTEXTS-Labels kommen jetzt aus i18n.js (TRANSLATIONS[lang].ctx*)
function getContexts() {
  const t = TRANSLATIONS[getLang()];
  return {
    schule: t.ctxSchule,
    arbeit: t.ctxArbeit,
    nachbarschaft: t.ctxNachbarschaft,
    diskriminierung: t.ctxDiskriminierung,
  };
}

// Anlaufstellen: Name/Telefon/URL sind sprachneutral, Gruppentitel & Intro kommen aus i18n.js
const HELP_ITEMS = [
  [
    { name: "MobbingLine NRW", detail: "Tel. 0211 837 1911 · Mo–Do 16–20 Uhr, vertraulich & kostenlos", url: "https://www.arbeitsschutz.nrw.de/beratung-beschwerde/arbeitsschutzberatung/mobbing-am-arbeitsplatz" },
    { name: "Mobbing-Beratungstelefon Freiburg/Südbaden", detail: "Tel. 0761 292 800 99 · Di & Do 17–19 Uhr, anonym & kostenlos", url: "https://mobbing-beratungstelefon.de/" },
    { name: "Hilfetelefon (bundesweit, mehrsprachig)", detail: "Kostenlose, vertrauliche Beratung rund um die Uhr", url: "https://www.hilfetelefon.de/gewalt-gegen-frauen/mobbing/" },
  ],
  [
    { name: "Elterntelefon – Nummer gegen Kummer", detail: "Tel. 0800 111 0 550 · Mo–Fr 9–17 Uhr, Di & Do bis 19 Uhr", url: "https://www.nummergegenkummer.de/elternberatung/" },
    { name: "Antidiskriminierungsstelle – Diskriminierung an Schulen", detail: "Infos & Anlaufstellen für Eltern, Lehrkräfte und Schüler:innen", url: "https://www.antidiskriminierungsstelle.de/DE/ueber-diskriminierung/lebensbereiche/bildungsbereiche/schule/schule-node.html" },
  ],
  [
    { name: "Kinder- und Jugendtelefon", detail: "Tel. 116 111 · Mo–Sa 14–20 Uhr, anonym & kostenlos", url: "https://www.nummergegenkummer.de/kinder-und-jugendtelefon.html" },
    { name: "JUUUPORT", detail: "Jugendliche beraten Jugendliche · Online-Beratung bei Cybermobbing", url: "https://www.juuuport.de/" },
  ],
  [
    { name: "Antidiskriminierungsstelle des Bundes", detail: "Kostenlose, unabhängige Rechtsberatung · beratung@ads.bund.de", url: "https://www.antidiskriminierungsstelle.de/DE/wir-beraten-sie/wir-beraten-sie-node.html" },
  ],
  [
    { name: "TelefonSeelsorge", detail: "Tel. 0800 111 0 111 oder 0800 111 0 222 · kostenlos, 24/7", url: "https://www.telefonseelsorge.de/" },
    { name: "Notruf", detail: "Bei akuter Gefahr: 112", url: null },
  ],
];

const STORAGE_KEY = "mobbing_faelle_v1";
const API_KEY_STORAGE = "anthropic_api_key_v1";
const PRO_STORAGE = "fallordner_pro_v1";
// ⚠️ Hier deinen echten Stripe-Payment-Link eintragen, sobald du ihn erstellt hast:
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/HIER_DEINEN_LINK_EINTRAGEN";

// ⚠️ Institutions-Lizenzcodes: für jede verkaufte Institutionslizenz hier einen
// eigenen, eindeutigen Code eintragen (z. B. "SCHULE-MUSTERSTADT-2026").
// Jede Person an dieser Institution gibt den Code einmalig ein, um Pro dauerhaft
// freizuschalten — kein individuelles Abo nötig.
const VALID_LICENSE_CODES = [
  // "SCHULE-MUSTERSTADT-2026",
];

function isPro() {
  return localStorage.getItem(PRO_STORAGE) === "true";
}

function renderProGate() {
  const lock = document.getElementById("pro-lock");
  const content = document.getElementById("pro-content");
  const link = document.getElementById("upgrade-link");
  link.href = STRIPE_PAYMENT_LINK;
  if (isPro()) {
    lock.hidden = true;
    content.hidden = false;
  } else {
    lock.hidden = false;
    content.hidden = true;
  }
}

document.getElementById("btn-activate-code").addEventListener("click", () => {
  const t = TRANSLATIONS[getLang()];
  const input = document.getElementById("license-code");
  const errorEl = document.getElementById("license-error");
  const code = input.value.trim().toUpperCase();
  errorEl.hidden = true;
  if (VALID_LICENSE_CODES.map((c) => c.toUpperCase()).includes(code)) {
    localStorage.setItem(PRO_STORAGE, "true");
    renderProGate();
  } else {
    errorEl.textContent = t.licenseCodeInvalid;
    errorEl.hidden = false;
  }
});

let entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let selectedIds = new Set();

// ---------- Tabs ----------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tabpanel").forEach((p) => (p.hidden = true));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).hidden = false;
  });
});

// ---------- Entries ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
  const list = document.getElementById("entry-list");
  const count = document.getElementById("entry-count");
  const exportBtn = document.getElementById("btn-export-pdf");
  const shareBtn = document.getElementById("btn-share");
  count.textContent = `(${entries.length})`;
  exportBtn.hidden = entries.length === 0;
  shareBtn.hidden = entries.length === 0;
  list.innerHTML = "";
  if (entries.length === 0) {
    list.innerHTML = `<p class="hint" style="font-style:italic">${TRANSLATIONS[getLang()].emptyEntries}</p>`;
  }
  entries.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <div class="entry-top">
        <div class="entry-left">
          <span class="entry-id mono">#${String(entries.length - i).padStart(3, "0")}</span>
          <span class="entry-date">${e.date}</span>
          <span class="badge">${getContexts()[e.context] || e.context}</span>
        </div>
        <div>
          <button class="del-btn" data-id="${e.id}" aria-label="delete">🗑</button>
        </div>
      </div>
      <div class="entry-detail" hidden>
        ${e.place ? `<p><strong>Ort:</strong> ${escapeHtml(e.place)}</p>` : ""}
        ${e.people ? `<p><strong>Beteiligte:</strong> ${escapeHtml(e.people)}</p>` : ""}
        ${e.witnesses ? `<p><strong>Zeug:innen:</strong> ${escapeHtml(e.witnesses)}</p>` : ""}
        <p>${escapeHtml(e.description)}</p>
        ${e.photo ? `<img src="${e.photo}" class="entry-photo" alt="Anhang" /><div class="photo-meta">${TRANSLATIONS[getLang()].photoUploadedAt}: ${e.photoUploadedAt || ""}</div>` : ""}
      </div>
    `;
    div.querySelector(".entry-top").addEventListener("click", (ev) => {
      if (ev.target.closest(".del-btn")) return;
      const d = div.querySelector(".entry-detail");
      d.hidden = !d.hidden;
    });
    div.querySelector(".del-btn").addEventListener("click", () => {
      entries = entries.filter((x) => x.id !== e.id);
      selectedIds.delete(e.id);
      saveEntries();
      renderEntries();
      renderReportSelect();
    });
    list.appendChild(div);
  });
  renderPatterns();
}

function renderPatterns() {
  const section = document.getElementById("pattern-section");
  const statsEl = document.getElementById("pattern-stats");
  const chartEl = document.getElementById("pattern-chart");
  const t = TRANSLATIONS[getLang()];
  if (entries.length < 2) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  // Häufigster Kontext
  const contextCounts = {};
  entries.forEach((e) => (contextCounts[e.context] = (contextCounts[e.context] || 0) + 1));
  const topContext = Object.entries(contextCounts).sort((a, b) => b[1] - a[1])[0];

  // Zeitspanne
  const dates = entries.map((e) => e.date).filter(Boolean).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];

  // Eskalation: Vorfälle pro Monat
  const byMonth = {};
  entries.forEach((e) => {
    if (!e.date) return;
    const month = e.date.slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  const months = Object.keys(byMonth).sort();
  const maxCount = Math.max(...Object.values(byMonth), 1);

  statsEl.innerHTML = `
    <div class="stat-box"><div class="stat-num">${entries.length}</div><div class="stat-label">${t.statTotal}</div></div>
    <div class="stat-box"><div class="stat-num">${getContexts()[topContext[0]] || topContext[0]}</div><div class="stat-label">${t.statTopContext} (${topContext[1]}×)</div></div>
    <div class="stat-box"><div class="stat-num">${first} – ${last}</div><div class="stat-label">${t.statTimeframe}</div></div>
  `;

  chartEl.innerHTML = `<div class="chart-label">${t.chartLabel}</div>` +
    months.map((m) => {
      const h = Math.round((byMonth[m] / maxCount) * 60) + 8;
      return `<div class="bar-col"><div class="bar" style="height:${h}px" title="${byMonth[m]}"></div><div class="bar-label">${m}</div></div>`;
    }).join("");

  if (months.length >= 3) {
    const recent = byMonth[months[months.length - 1]];
    const earlier = byMonth[months[0]];
    if (recent > earlier) {
      chartEl.innerHTML += `<p class="escalation-note">${t.escalationNote}</p>`;
    }
  }

  // Eskalationsstufen-Ampel
  const increasing = months.length >= 3 && byMonth[months[months.length - 1]] > byMonth[months[0]];
  let level = "low";
  if (entries.length >= 6 || (increasing && entries.length >= 3)) level = "high";
  else if (entries.length >= 3 || increasing) level = "medium";
  const levelLabel = { low: t.levelLow, medium: t.levelMedium, high: t.levelHigh }[level];
  const levelDesc = { low: t.levelLowDesc, medium: t.levelMediumDesc, high: t.levelHighDesc }[level];
  document.getElementById("escalation-badge").innerHTML = `
    <div class="esc-dot esc-${level}"></div>
    <div><strong>${t.escalationLabel}: ${levelLabel}</strong><div class="esc-desc">${levelDesc}</div></div>
  `;

  // Nächste-Schritte-Checkliste
  document.getElementById("next-steps").innerHTML = `
    <h4>${t.nextStepsHeading}</h4>
    <ul>
      <li>${t.nextStep1}</li>
      <li>${t.nextStep2}</li>
      <li>${t.nextStep3}</li>
      <li>${t.nextStep4}</li>
    </ul>
  `;
}

document.getElementById("btn-export-pdf").addEventListener("click", () => {
  window.open("export.html", "_blank");
});

document.getElementById("btn-share").addEventListener("click", () => {
  const t = TRANSLATIONS[getLang()];
  const box = document.getElementById("share-box");
  try {
    const json = JSON.stringify(entries);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    if (encoded.length > 6000) {
      box.hidden = false;
      box.innerHTML = `<p class="error">${t.shareTooLarge}</p>`;
      return;
    }
    const url = `${window.location.origin}${window.location.pathname.replace("index.html", "")}share.html#${encoded}`;
    box.hidden = false;
    box.innerHTML = `
      <p class="hint">${t.shareHint}</p>
      <p class="share-warning">${t.shareWarning}</p>
      <div class="share-link-row">
        <input type="text" id="share-url" readonly value="${url}" />
        <button id="btn-copy-share" class="btn btn-ghost small">${t.shareCopyBtn}</button>
      </div>
    `;
    document.getElementById("btn-copy-share").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
        const b = document.getElementById("btn-copy-share");
        const old = b.textContent;
        b.textContent = t.shareCopied;
        setTimeout(() => (b.textContent = old), 1800);
      } catch (e) {}
    });
  } catch (e) {
    box.hidden = false;
    box.innerHTML = `<p class="error">${t.shareTooLarge}</p>`;
  }
});

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ---------- Foto-Anhang (komprimiert via Canvas, als dataURL in localStorage) ----------
let pendingPhoto = null;

function compressImage(file, maxDim = 900, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("f-photo").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  const preview = document.getElementById("photo-preview");
  if (!file) { pendingPhoto = null; preview.hidden = true; return; }
  try {
    pendingPhoto = await compressImage(file);
    preview.hidden = false;
    preview.innerHTML = `<img src="${pendingPhoto}" style="max-width:160px;border-radius:6px;border:1px solid var(--line);display:block;margin-top:6px;" />`;
  } catch (e) {
    pendingPhoto = null;
  }
});

document.getElementById("entry-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const entry = {
    id: uid(),
    date: document.getElementById("f-date").value,
    context: document.getElementById("f-context").value,
    place: document.getElementById("f-place").value,
    people: document.getElementById("f-people").value,
    witnesses: document.getElementById("f-witnesses").value,
    description: document.getElementById("f-description").value,
    photo: pendingPhoto || null,
    photoUploadedAt: pendingPhoto ? new Date().toLocaleString(getLang() === "de" ? "de-DE" : getLang()) : null,
    createdAt: new Date().toISOString(),
  };
  if (!entry.date || !entry.description.trim()) return;
  entries.unshift(entry);
  saveEntries();
  ev.target.reset();
  pendingPhoto = null;
  document.getElementById("photo-preview").hidden = true;
  document.getElementById("photo-preview").innerHTML = "";
  renderEntries();
  renderReportSelect();
});

// ---------- Report tab ----------
function renderReportSelect() {
  const container = document.getElementById("report-select");
  container.innerHTML = "";
  if (entries.length === 0) {
    container.innerHTML = `<p class="hint" style="font-style:italic">${TRANSLATIONS[getLang()].emptyEntriesReport}</p>`;
    return;
  }
  entries.forEach((e) => {
    const label = document.createElement("label");
    label.className = "report-item";
    label.innerHTML = `
      <input type="checkbox" ${selectedIds.has(e.id) ? "checked" : ""} data-id="${e.id}" />
      <span><strong>${e.date}</strong> · ${getContexts()[e.context]} — ${escapeHtml(e.description.slice(0, 70))}${e.description.length > 70 ? "…" : ""}</span>
    `;
    label.querySelector("input").addEventListener("change", (ev) => {
      if (ev.target.checked) selectedIds.add(e.id);
      else selectedIds.delete(e.id);
    });
    container.appendChild(label);
  });
}

document.getElementById("api-key").value = localStorage.getItem(API_KEY_STORAGE) || "";
document.getElementById("btn-save-key").addEventListener("click", () => {
  localStorage.setItem(API_KEY_STORAGE, document.getElementById("api-key").value.trim());
  alert(TRANSLATIONS[getLang()].apiKeySaved);
});

document.getElementById("btn-draft").addEventListener("click", async () => {
  const t = TRANSLATIONS[getLang()];
  const errorEl = document.getElementById("draft-error");
  const outputEl = document.getElementById("draft-output");
  errorEl.hidden = true;
  outputEl.hidden = true;

  const chosen = entries.filter((e) => selectedIds.has(e.id));
  if (chosen.length === 0) {
    errorEl.textContent = t.draftErrorNoSelection;
    errorEl.hidden = false;
    return;
  }
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) {
    errorEl.textContent = t.draftErrorNoKey;
    errorEl.hidden = false;
    return;
  }

  const recipientLabel = {
    schule: "die Schulleitung",
    arbeit: "die Personal-/Betriebsratsabteilung des Arbeitgebers",
    diskriminierung: "eine Antidiskriminierungs-Beratungsstelle",
  }[document.getElementById("f-recipient").value];

  const incidentsText = chosen
    .map(
      (e, i) =>
        `Vorfall ${i + 1}:\nDatum: ${e.date}\nKontext: ${getContexts()[e.context]}\nOrt: ${e.place || "-"}\nBeteiligte Personen: ${e.people || "-"}\nZeug:innen: ${e.witnesses || "-"}\nBeschreibung: ${e.description}`
    )
    .join("\n\n");

  const prompt = `Du hilfst einer betroffenen Person (oder einem Elternteil), eine sachliche, ruhige und rechtlich unaufgeregte schriftliche Meldung/Beschwerde über Mobbing- bzw. Diskriminierungsvorfälle zu formulieren, die an ${recipientLabel} gerichtet ist.

Nutze ausschließlich die folgenden dokumentierten Vorfälle als Tatsachengrundlage. Erfinde keine zusätzlichen Fakten. Schreibe auf Deutsch, in Briefform (ohne Adressfelder), mit: kurzer Einleitung, chronologischer, sachlicher Schilderung der Vorfälle, einer klaren Bitte um Prüfung und Reaktion, und einem höflichen Schluss. Maximal ca. 350 Wörter. Verwende Platzhalter wie [Name], [Klasse/Abteilung], [Datum] wo persönliche Daten nötig sind, die hier nicht vorliegen.

Dokumentierte Vorfälle:
${incidentsText}`;

  const btn = document.getElementById("btn-draft");
  btn.disabled = true;
  btn.textContent = t.btnDrafting;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "API error");
    const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
    if (!text) throw new Error("Empty response");
    document.getElementById("draft-text").textContent = text;
    outputEl.hidden = false;
  } catch (e) {
    errorEl.textContent = t.draftErrorGeneric + e.message;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = t.btnDraft;
  }
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  const text = document.getElementById("draft-text").textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("btn-copy");
    const old = btn.textContent;
    btn.textContent = TRANSLATIONS[getLang()].btnCopied;
    setTimeout(() => (btn.textContent = old), 1800);
  } catch (e) {}
});

// ---------- Help tab ----------
function renderHelp() {
  const container = document.getElementById("help-list");
  const t = TRANSLATIONS[getLang()];
  container.innerHTML = "";
  t.helpGroups.forEach((g, gi) => {
    const wrap = document.createElement("div");
    wrap.className = "help-group";
    wrap.innerHTML = `
      <button class="help-summary">
        <span><span class="help-title">${g.group}</span><span class="help-intro">${g.intro}</span></span>
        <span class="chev">▾</span>
      </button>
      <div class="help-items">
        ${HELP_ITEMS[gi]
          .map(
            (it) => `
          <div>
            <div class="help-item-name">${it.name}</div>
            <div class="help-item-detail">${it.detail}</div>
            ${it.url ? `<a class="help-item-link" href="${it.url}" target="_blank" rel="noopener noreferrer">${t.helpLinkText} ↗</a>` : ""}
          </div>`
          )
          .join("")}
      </div>
    `;
    const btn = wrap.querySelector(".help-summary");
    const items = wrap.querySelector(".help-items");
    btn.addEventListener("click", () => {
      const isOpen = items.classList.contains("open");
      document.querySelectorAll(".help-items").forEach((el) => el.classList.remove("open"));
      document.querySelectorAll(".help-summary").forEach((el) => el.classList.remove("open"));
      if (!isOpen) {
        items.classList.add("open");
        btn.classList.add("open");
      }
    });
    container.appendChild(wrap);
  });
}

renderEntries();
renderReportSelect();
renderHelp();
renderProGate();
applyTranslations();

// ---------- Sprachumschalter ----------
function applyTranslations() {
  const lang = getLang();
  const t = TRANSLATIONS[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;
  document.body.classList.toggle("rtl", t.dir === "rtl");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] === undefined) return;
    // Label-Elemente mit verschachteltem Input/Select: nur den Text-Knoten ersetzen
    if (el.tagName === "LABEL" && el.querySelector("input, select, textarea")) {
      const child = el.querySelector("input, select, textarea");
      el.childNodes[0].textContent = t[key] + " ";
      if (!el.contains(child)) el.appendChild(child);
    } else {
      el.textContent = t[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  document.getElementById("lang-select").value = lang;
  renderEntries();
  renderReportSelect();
  renderHelp();
}

document.getElementById("lang-select").addEventListener("change", (ev) => {
  setLang(ev.target.value);
  applyTranslations();
});
