const CONTEXTS = {
  schule: "Schule",
  arbeit: "Arbeitsplatz",
  nachbarschaft: "Nachbarschaft",
  diskriminierung: "Diskriminierung (allgemein)",
};

const HELP = [
  {
    group: "Mobbing am Arbeitsplatz",
    intro: "Für Arbeitnehmer:innen, Betriebs- und Personalräte.",
    items: [
      { name: "MobbingLine NRW", detail: "Tel. 0211 837 1911 · Mo–Do 16–20 Uhr, vertraulich & kostenlos", url: "https://www.arbeitsschutz.nrw.de/beratung-beschwerde/arbeitsschutzberatung/mobbing-am-arbeitsplatz" },
      { name: "Mobbing-Beratungstelefon Freiburg/Südbaden", detail: "Tel. 0761 292 800 99 · Di & Do 17–19 Uhr, anonym & kostenlos", url: "https://mobbing-beratungstelefon.de/" },
      { name: "Hilfetelefon (bundesweit, mehrsprachig)", detail: "Kostenlose, vertrauliche Beratung rund um die Uhr", url: "https://www.hilfetelefon.de/gewalt-gegen-frauen/mobbing/" },
    ],
  },
  {
    group: "Für Eltern & bei Mobbing in der Schule",
    intro: "Kostenlose, anonyme Beratung für Erziehungsberechtigte.",
    items: [
      { name: "Elterntelefon – Nummer gegen Kummer", detail: "Tel. 0800 111 0 550 · Mo–Fr 9–17 Uhr, Di & Do bis 19 Uhr", url: "https://www.nummergegenkummer.de/elternberatung/" },
      { name: "Antidiskriminierungsstelle – Diskriminierung an Schulen", detail: "Infos & Anlaufstellen für Eltern, Lehrkräfte und Schüler:innen", url: "https://www.antidiskriminierungsstelle.de/DE/ueber-diskriminierung/lebensbereiche/bildungsbereiche/schule/schule-node.html" },
    ],
  },
  {
    group: "Für Schüler:innen (auch Gruppen- & Cybermobbing)",
    intro: "Kostenlose Beratung direkt für Kinder und Jugendliche.",
    items: [
      { name: "Kinder- und Jugendtelefon", detail: "Tel. 116 111 · Mo–Sa 14–20 Uhr, anonym & kostenlos", url: "https://www.nummergegenkummer.de/kinder-und-jugendtelefon.html" },
      { name: "JUUUPORT", detail: "Jugendliche beraten Jugendliche · Online-Beratung bei Cybermobbing", url: "https://www.juuuport.de/" },
    ],
  },
  {
    group: "Diskriminierung allgemein",
    intro: "Bei Benachteiligung wegen Herkunft, Geschlecht, Behinderung, Religion, Alter u. a.",
    items: [
      { name: "Antidiskriminierungsstelle des Bundes", detail: "Kostenlose, unabhängige Rechtsberatung · beratung@ads.bund.de", url: "https://www.antidiskriminierungsstelle.de/DE/wir-beraten-sie/wir-beraten-sie-node.html" },
    ],
  },
  {
    group: "In akuten Krisen",
    intro: "Wenn es gerade sehr schwer ist – rund um die Uhr erreichbar.",
    items: [
      { name: "TelefonSeelsorge", detail: "Tel. 0800 111 0 111 oder 0800 111 0 222 · kostenlos, 24/7", url: "https://www.telefonseelsorge.de/" },
      { name: "Notruf", detail: "Bei akuter Gefahr: 112", url: null },
    ],
  },
];

const STORAGE_KEY = "mobbing_faelle_v1";
const API_KEY_STORAGE = "anthropic_api_key_v1";

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
  count.textContent = `(${entries.length})`;
  list.innerHTML = "";
  if (entries.length === 0) {
    list.innerHTML = `<p class="hint" style="font-style:italic">Noch keine Vorfälle dokumentiert.</p>`;
  }
  entries.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <div class="entry-top">
        <div class="entry-left">
          <span class="entry-id mono">#${String(entries.length - i).padStart(3, "0")}</span>
          <span class="entry-date">${e.date}</span>
          <span class="badge">${CONTEXTS[e.context] || e.context}</span>
        </div>
        <div>
          <button class="del-btn" data-id="${e.id}" aria-label="Löschen">🗑</button>
        </div>
      </div>
      <div class="entry-detail" hidden>
        ${e.place ? `<p><strong>Ort:</strong> ${escapeHtml(e.place)}</p>` : ""}
        ${e.people ? `<p><strong>Beteiligte:</strong> ${escapeHtml(e.people)}</p>` : ""}
        ${e.witnesses ? `<p><strong>Zeug:innen:</strong> ${escapeHtml(e.witnesses)}</p>` : ""}
        <p>${escapeHtml(e.description)}</p>
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
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

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
    createdAt: new Date().toISOString(),
  };
  if (!entry.date || !entry.description.trim()) return;
  entries.unshift(entry);
  saveEntries();
  ev.target.reset();
  renderEntries();
  renderReportSelect();
});

// ---------- Report tab ----------
function renderReportSelect() {
  const container = document.getElementById("report-select");
  container.innerHTML = "";
  if (entries.length === 0) {
    container.innerHTML = `<p class="hint" style="font-style:italic">Noch keine Vorfälle vorhanden. Lege zuerst unter „Dokumentieren" Einträge an.</p>`;
    return;
  }
  entries.forEach((e) => {
    const label = document.createElement("label");
    label.className = "report-item";
    label.innerHTML = `
      <input type="checkbox" ${selectedIds.has(e.id) ? "checked" : ""} data-id="${e.id}" />
      <span><strong>${e.date}</strong> · ${CONTEXTS[e.context]} — ${escapeHtml(e.description.slice(0, 70))}${e.description.length > 70 ? "…" : ""}</span>
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
  alert("API-Key lokal gespeichert.");
});

document.getElementById("btn-draft").addEventListener("click", async () => {
  const errorEl = document.getElementById("draft-error");
  const outputEl = document.getElementById("draft-output");
  errorEl.hidden = true;
  outputEl.hidden = true;

  const chosen = entries.filter((e) => selectedIds.has(e.id));
  if (chosen.length === 0) {
    errorEl.textContent = "Bitte wähle mindestens einen Vorfall aus.";
    errorEl.hidden = false;
    return;
  }
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) {
    errorEl.textContent = "Bitte hinterlege zuerst deinen Anthropic-API-Key unter „KI-Einstellungen".";
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
        `Vorfall ${i + 1}:\nDatum: ${e.date}\nKontext: ${CONTEXTS[e.context]}\nOrt: ${e.place || "-"}\nBeteiligte Personen: ${e.people || "-"}\nZeug:innen: ${e.witnesses || "-"}\nBeschreibung: ${e.description}`
    )
    .join("\n\n");

  const prompt = `Du hilfst einer betroffenen Person (oder einem Elternteil), eine sachliche, ruhige und rechtlich unaufgeregte schriftliche Meldung/Beschwerde über Mobbing- bzw. Diskriminierungsvorfälle zu formulieren, die an ${recipientLabel} gerichtet ist.

Nutze ausschließlich die folgenden dokumentierten Vorfälle als Tatsachengrundlage. Erfinde keine zusätzlichen Fakten. Schreibe auf Deutsch, in Briefform (ohne Adressfelder), mit: kurzer Einleitung, chronologischer, sachlicher Schilderung der Vorfälle, einer klaren Bitte um Prüfung und Reaktion, und einem höflichen Schluss. Maximal ca. 350 Wörter. Verwende Platzhalter wie [Name], [Klasse/Abteilung], [Datum] wo persönliche Daten nötig sind, die hier nicht vorliegen.

Dokumentierte Vorfälle:
${incidentsText}`;

  const btn = document.getElementById("btn-draft");
  btn.disabled = true;
  btn.textContent = "Entwurf wird erstellt…";

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
    if (data.error) throw new Error(data.error.message || "API-Fehler");
    const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
    if (!text) throw new Error("Leere Antwort");
    document.getElementById("draft-text").textContent = text;
    outputEl.hidden = false;
  } catch (e) {
    errorEl.textContent = "Der Entwurf konnte nicht erstellt werden: " + e.message;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "✉️ Meldungstext mit KI entwerfen";
  }
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  const text = document.getElementById("draft-text").textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("btn-copy");
    const old = btn.textContent;
    btn.textContent = "Kopiert ✓";
    setTimeout(() => (btn.textContent = old), 1800);
  } catch (e) {}
});

// ---------- Help tab ----------
function renderHelp() {
  const container = document.getElementById("help-list");
  container.innerHTML = "";
  HELP.forEach((g, gi) => {
    const wrap = document.createElement("div");
    wrap.className = "help-group";
    wrap.innerHTML = `
      <button class="help-summary">
        <span><span class="help-title">${g.group}</span><span class="help-intro">${g.intro}</span></span>
        <span class="chev">▾</span>
      </button>
      <div class="help-items">
        ${g.items
          .map(
            (it) => `
          <div>
            <div class="help-item-name">${it.name}</div>
            <div class="help-item-detail">${it.detail}</div>
            ${it.url ? `<a class="help-item-link" href="${it.url}" target="_blank" rel="noopener noreferrer">Zur Webseite ↗</a>` : ""}
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
