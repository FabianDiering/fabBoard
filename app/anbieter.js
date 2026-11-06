// KI-Anbieter für fabBoard: Auswahl, Prüfung (installiert? angemeldet?), API-Schlüssel und Startbefehl.
// fabBoard ist modellunabhängig. Es meldet sich nie selbst an, sondern startet nur das offizielle Programm (CLI)
// des Anbieters, das der Nutzer installiert und angemeldet hat, bzw. gibt ihm den eigenen API-Schlüssel des Nutzers mit.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { T } = require('./oberflaeche/texte.js'); // Texte Deutsch/Englisch (Sprache stellt server.js ein)

const WIN = process.platform === 'win32';
const HOME = os.homedir();
const C = WIN ? '.cmd' : ''; // npm-Programme heißen unter Windows z. B. codex.cmd (PowerShell blockiert codex.ps1)

const CLAUDE_INSTALL = WIN ? 'irm https://claude.ai/install.ps1 | iex' : 'curl -fsSL https://claude.ai/install.sh | bash';
const AGY_INSTALL = WIN ? 'irm https://antigravity.google/cli/install.ps1 | iex' : 'curl -fsSL https://antigravity.google/cli/install.sh | bash';
const UV_INSTALL = WIN ? 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"' : 'curl -LsSf https://astral.sh/uv/install.sh | sh';

// gruppe: abo (Konto/Abo), schluessel (eigener API-Schlüssel), lokal (Modell auf dem eigenen Rechner)
// konto, anmeldenText: Schlüssel in oberflaeche/texte.js (Deutsch/Englisch)
// motor: welches offizielle Programm die Arbeit macht
// Gemini mit Google-Konto läuft über Antigravity CLI (agy): Google hat Gemini CLI für private Konten am 18.06.2026 abgeschaltet.
// Gemini CLI bleibt nur für den eigenen API-Schlüssel (google-key).
const ANBIETER = [
  { id: 'claude', gruppe: 'abo', name: 'Claude Code', kurz: 'Claude', konto: 'kontoClaude', programm: 'claude', motor: 'claude',
    installieren: [CLAUDE_INSTALL], anmelden: 'claude auth login', bedingungen: 'https://www.anthropic.com/legal/consumer-terms' },
  { id: 'codex', gruppe: 'abo', name: 'OpenAI Codex', kurz: 'Codex', konto: 'kontoCodex', programm: 'codex', motor: 'codex', node: true,
    installieren: [`npm${C} install -g @openai/codex`], anmelden: `codex${C} login`, bedingungen: 'https://openai.com/policies/row-terms-of-use/' },
  { id: 'gemini', gruppe: 'abo', name: 'Gemini (Antigravity)', kurz: 'Gemini', konto: 'kontoGemini', programm: 'agy', motor: 'agy',
    installieren: [AGY_INSTALL], anmelden: 'agy', anmeldenText: 'agyAnmelden', bedingungen: 'https://antigravity.google/terms' },
  { id: 'anthropic-key', gruppe: 'schluessel', name: 'Anthropic (Claude)', kurz: 'Claude', konto: 'kontoNutzung', programm: 'claude', motor: 'claude',
    env: ['ANTHROPIC_API_KEY'], schluesselUrl: 'https://console.anthropic.com/settings/keys', installieren: [CLAUDE_INSTALL], bedingungen: 'https://www.anthropic.com/legal/commercial-terms' },
  { id: 'openai-key', gruppe: 'schluessel', name: 'OpenAI (GPT)', kurz: 'Codex', konto: 'kontoNutzung', programm: 'codex', motor: 'codex', node: true,
    env: ['CODEX_API_KEY', 'OPENAI_API_KEY'], schluesselUrl: 'https://platform.openai.com/api-keys', installieren: [`npm${C} install -g @openai/codex`], bedingungen: 'https://openai.com/policies/services-agreement/' },
  { id: 'google-key', gruppe: 'schluessel', name: 'Google (Gemini)', kurz: 'Gemini', konto: 'kontoGoogleKey', programm: 'gemini', motor: 'gemini', node: true,
    env: ['GEMINI_API_KEY'], schluesselUrl: 'https://aistudio.google.com/apikey', installieren: [`npm${C} install -g @google/gemini-cli`], bedingungen: 'https://ai.google.dev/gemini-api/terms' },
  { id: 'mistral-key', gruppe: 'schluessel', name: 'Mistral', kurz: 'Mistral', konto: 'kontoNutzung', programm: 'vibe', motor: 'vibe',
    env: ['MISTRAL_API_KEY'], schluesselUrl: 'https://console.mistral.ai/api-keys', installieren: [UV_INSTALL, 'uv tool install mistral-vibe'], bedingungen: 'https://mistral.ai/terms' },
  { id: 'ollama', gruppe: 'lokal', name: 'Ollama', kurz: 'Ollama', konto: 'kontoLokal', programm: 'codex', motor: 'codex', node: true,
    lokal: { provider: 'ollama', url: 'http://127.0.0.1:11434/api/tags', liste: (j) => (j.models || []).map((m) => m.name), laden: 'https://ollama.com/download', modellBefehl: 'ollama pull qwen3-coder' },
    installieren: [`npm${C} install -g @openai/codex`], bedingungen: 'https://ollama.com' },
  { id: 'lmstudio', gruppe: 'lokal', name: 'LM Studio', kurz: 'LM Studio', konto: 'kontoLokal', programm: 'codex', motor: 'codex', node: true,
    lokal: { provider: 'lmstudio', url: 'http://127.0.0.1:1234/v1/models', liste: (j) => (j.data || []).map((m) => m.id), laden: 'https://lmstudio.ai/download' },
    installieren: [`npm${C} install -g @openai/codex`], bedingungen: 'https://lmstudio.ai/app-terms' },
];
const finde = (id) => ANBIETER.find((a) => a.id === id) || null;
// Für das Board: alles außer Funktionen
const oeffentlich = (a) => ({ id: a.id, gruppe: a.gruppe, name: a.name, kurz: a.kurz, konto: T(a.konto), bedingungen: a.bedingungen, schluesselUrl: a.schluesselUrl || '', lokal: !!a.lokal, schluessel: !!a.env });

// Programm im PATH und an den üblichen Installationsorten suchen (die App hat beim Start über eine Verknüpfung evtl. einen knappen PATH)
function programmFinden(name) {
  const dirs = [...(process.env.PATH || '').split(path.delimiter), path.join(HOME, '.local', 'bin')];
  if (WIN && process.env.APPDATA) dirs.push(path.join(process.env.APPDATA, 'npm'));
  if (WIN && process.env.LOCALAPPDATA) dirs.push(path.join(process.env.LOCALAPPDATA, 'agy', 'bin')); // Antigravity-Installer
  if (!WIN) dirs.push('/opt/homebrew/bin', '/usr/local/bin');
  for (const d of dirs.filter(Boolean)) for (const x of WIN ? ['.exe', '.cmd'] : ['']) {
    const f = path.join(d, name + x);
    try { if (fs.statSync(f).isFile()) return f; } catch (e) {}
  }
  return null;
}
// .cmd-Dateien startet Node unter Windows nur über cmd.exe; Anführungszeichen in Argumenten werden dabei zu '
function aufruf(exe, args) {
  if (WIN && /\.(cmd|bat)$/i.test(exe)) {
    const q = (a) => '"' + String(a).replace(/"/g, "'") + '"';
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', '"' + [exe, ...args].map(q).join(' ') + '"'], { windowsVerbatimArguments: true }];
  }
  return [exe, args, {}];
}
function ausfuehren(exe, args, sek = 20) {
  return new Promise((ok) => {
    const [cmd, a, o] = aufruf(exe, args);
    let out = '';
    let p;
    try { p = spawn(cmd, a, { ...o, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return ok({ code: -1, out: e.message }); }
    const t = setTimeout(() => { try { p.kill(); } catch (e) {} }, sek * 1000);
    p.stdout.on('data', (c) => { out += c; });
    p.stderr.on('data', (c) => { out += c; });
    p.on('error', (e) => { clearTimeout(t); ok({ code: -1, out: e.message }); });
    p.on('close', (code) => { clearTimeout(t); ok({ code: code == null ? -1 : code, out: out.trim() }); });
  });
}

// API-Schlüssel: verschlüsselt mit dem Schlüsselbund des Betriebssystems (Electron safeStorage, unter Windows DPAPI),
// gespeichert im App-Datenordner, nicht in daten\ (der wird per Handy-Sync hochgeladen). Das Board bekommt den Schlüssel nie zurück.
let SAFE = null;
let SDATEI = null;
try {
  if (process.versions.electron) {
    const e = require('electron');
    SAFE = e.safeStorage;
    SDATEI = path.join(e.app.getPath('userData'), 'schluessel.json');
  }
} catch (e) {}
const schluesselAlle = () => { try { return JSON.parse(fs.readFileSync(SDATEI, 'utf8')); } catch (e) { return {}; } };
function schluesselLesen(id) {
  const s = SDATEI && schluesselAlle()[id];
  if (!s || !SAFE) return '';
  try { return SAFE.decryptString(Buffer.from(s, 'base64')); } catch (e) { return ''; }
}
function schluesselSpeichern(id, wert) {
  if (!finde(id)?.env) throw new Error(T('keinSchluesselNoetig'));
  if (!SAFE || !SAFE.isEncryptionAvailable()) throw new Error(T('schluesselNurApp'));
  const alle = schluesselAlle();
  if (wert) alle[id] = SAFE.encryptString(String(wert).trim()).toString('base64'); else delete alle[id];
  fs.mkdirSync(path.dirname(SDATEI), { recursive: true });
  fs.writeFileSync(SDATEI, JSON.stringify(alle, null, 1));
}

async function lokaleModelle(a) {
  try {
    const r = await fetch(a.lokal.url, { signal: AbortSignal.timeout(3000) });
    return a.lokal.liste(await r.json());
  } catch (e) { return null; }
}

// Prüfung für den Einrichtungs-Assistenten: Liste von Schritten {titel, ok, text, befehle, link, linkText}
async function pruefen(id, modell, claudePfad) {
  const a = finde(id);
  if (!a) return null;
  const s = [];
  const exe = (a.motor === 'claude' && claudePfad) || programmFinden(a.programm);
  // 1. Programm installiert?
  const shell = WIN ? T('shell') : T('terminal');
  if (a.node && !exe && !programmFinden('node')) {
    s.push({ titel: T('nodeT'), ok: false, text: T('nodeText', { name: a.name }), link: 'https://nodejs.org', linkText: T('nodeLink') });
  }
  let version = '';
  if (exe) { const v = await ausfuehren(exe, ['--version']); if (v.code === 0) version = v.out.split('\n')[0].trim(); }
  const prog = a.motor === 'claude' ? 'Claude Code' : a.motor === 'codex' ? 'OpenAI Codex' : a.motor === 'gemini' ? 'Gemini CLI' : a.motor === 'agy' ? 'Antigravity CLI' : 'Mistral Vibe';
  s.push(version
    ? { titel: T('installiertT', { prog }), ok: true, text: version }
    : { titel: T('installierenT', { prog }), ok: false, text: T(a.installieren.length > 1 ? 'installierenMehrere' : 'installierenEiner', { prog, shell }), befehle: a.installieren });
  // 2. Angemeldet, Schlüssel gespeichert bzw. lokales Modell bereit? (schluessel: true kennzeichnet den Schlüssel-Schritt für das Board)
  if (a.env) {
    const k = schluesselLesen(a.id);
    s.push(k ? { titel: T('schluesselOkT'), ok: true, schluessel: true, text: T('schluesselOk', { ende: k.slice(-4) }) }
      : { titel: T('schluesselT'), ok: false, schluessel: true, text: T('schluesselText'), link: a.schluesselUrl, linkText: T('schluesselLink'), eingabe: 'schluessel' });
  } else if (a.lokal) {
    const modelle = await lokaleModelle(a);
    if (!modelle) s.push({ titel: T('lokalStartenT', { name: a.name }), ok: false, text: T('lokalStarten', { name: a.name }) + (a.id === 'lmstudio' ? T('lmServer') : ''), link: a.lokal.laden, linkText: T('lokalLaden', { name: a.name }) });
    else if (!modelle.length) s.push({ titel: T('modellLadenT'), ok: false, text: T(a.lokal.modellBefehl ? 'modellLaden' : 'modellLadenLm', { name: a.name }), befehle: a.lokal.modellBefehl ? [a.lokal.modellBefehl] : undefined });
    else s.push({ titel: T('modellWaehlenT'), ok: !!modell && modelle.includes(modell), text: T('modellWaehlen', { name: a.name }), eingabe: 'modell', modelle });
  } else if (version) {
    let an = false;
    if (a.motor === 'claude') { const r = await ausfuehren(exe, ['auth', 'status']); try { an = JSON.parse(r.out).loggedIn === true; } catch (e) {} }
    if (a.motor === 'codex') { const r = await ausfuehren(exe, ['login', 'status']); an = r.code === 0 && /logged in/i.test(r.out); }
    // Antigravity hat keinen Statusbefehl: unter Windows liegt die Anmeldung in der Anmeldeinformationsverwaltung, sonst ein kurzer Probelauf
    if (a.motor === 'agy') {
      if (WIN) { const r = await ausfuehren('cmdkey', ['/list']); an = /gemini:antigravity/i.test(r.out); }
      else { const r = await ausfuehren(exe, ['-p', 'OK', '--output-format', 'json'], 60); try { an = JSON.parse(r.out.slice(r.out.indexOf('{'))).status === 'SUCCESS'; } catch (e) {} }
    }
    s.push(an ? { titel: T('angemeldetT'), ok: true, text: T('angemeldet', { prog }) }
      : { titel: T('anmeldenT'), ok: false, text: a.anmeldenText ? T(a.anmeldenText) : T('anmelden', { shell }), befehle: [a.anmelden] });
  }
  return { schritte: s, bereit: s.every((x) => x.ok) };
}

// Startbefehl für einen Lauf. Ergebnis: {exe, args, env, gitSelbst, text}
// gitSelbst: Codex sperrt in seinem Schutzmodus .git, deshalb legt fabBoard die Commits vor und nach dem Lauf selbst an.
async function startBefehl(id, { prompt, ordner, root, modell, claudeModell, claudePfad }) {
  const a = finde(id);
  if (!a) throw new Error(T('erstEinrichten'));
  const exe = (a.motor === 'claude' && claudePfad) || programmFinden(a.programm);
  if (!exe) throw new Error(T('programmFehlt', { name: a.name }));
  const env = { ...process.env };
  if (a.env) {
    const k = schluesselLesen(a.id);
    if (!k) throw new Error(T('keinSchluessel', { name: a.name }));
    for (const n of a.env) env[n] = k;
  }
  if (a.lokal && !modell) throw new Error(T('keinModell', { name: a.name }));
  if (a.motor === 'claude') {
    return { exe, env, text: `${a.name} · ${claudeModell}`, args: ['-p', prompt, '--model', claudeModell, '--permission-mode', 'acceptEdits', '--add-dir', root,
      '--allowedTools', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Bash(git *)', 'PowerShell(git *)', '--output-format', 'text'] };
  }
  if (a.motor === 'codex') {
    const p = prompt + ' ' + T('gitGesperrt');
    return { exe, env, gitSelbst: true, text: `${a.name}${modell ? ' · ' + modell : ''}`, args: ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write',
      ...(WIN ? ['-c', 'windows.sandbox=unelevated'] : []), '--add-dir', root, '-C', ordner,
      ...(a.lokal ? ['--oss', '--local-provider', a.lokal.provider, '-m', modell] : []), p] };
  }
  // Antigravity liest AGENTS.md/GEMINI.md im Projektordner selbst; Datenordner als zusätzlicher Arbeitsbereich
  if (a.motor === 'agy') return { exe, env, text: a.name, args: ['-p', prompt, '--dangerously-skip-permissions', '--add-dir', root, '--output-format', 'text'] };
  if (a.motor === 'gemini') {
    env.GEMINI_CLI_TRUST_WORKSPACE = 'true';
    return { exe, env, text: a.name, args: ['-p', prompt, '--yolo', '--include-directories', root] };
  }
  return { exe, env, text: a.name, args: ['--prompt', prompt, '--auto-approve'] };
}

module.exports = { ANBIETER, finde, oeffentlich, pruefen, startBefehl, aufruf, schluesselSpeichern, schluesselLesen, lokaleModelle };
