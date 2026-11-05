// fabBoard – lokaler Server für Node.js (keine Abhängigkeiten). Läuft in der App (app\main.js) oder allein mit "node server.js".
// Programm und Daten sind getrennt: Programmdateien liegen im Ordner app (wird später vom Installer mitgenommen),
// die Daten des Nutzers in seinem Datenordner (Standard: Dokumente\fabBoard; siehe datenOrdnerFinden).
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// PORT: im Netzwerk erreichbar (nur mit Passwort KI-Start). FABBOARD_PORT: anderer Port, nur auf diesem Rechner (z. B. zum Testen neben der laufenden App)
const PORT = Number(process.env.PORT || process.env.FABBOARD_PORT) || 4747;
const PASSWORT = process.env.FABBOARD_PASSWORT || '';
const APP = __dirname;
const OBERFLAECHE = path.join(APP, 'oberflaeche');
// Eigener Einstellungsordner der App (wie Electron app.getPath('userData')): merkt sich, wo der Datenordner liegt
const APPDATEN = process.env.APPDATA ? path.join(process.env.APPDATA, 'fabBoard')
  : process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support', 'fabBoard') : path.join(os.homedir(), '.config', 'fabBoard');
const ORT = path.join(APPDATEN, 'ort.json');
// Datenordner: 1. Umgebungsvariable FABBOARD_DATEN, 2. gespeicherter Ort (ort.json), 3. alter Ordner „daten“ neben dem
// Programm (fabBoard vor der Trennung; wird übernommen und gemerkt), 4. Standard Dokumente\fabBoard
function datenOrdnerFinden() {
  if (process.env.FABBOARD_DATEN) return process.env.FABBOARD_DATEN;
  try { const o = JSON.parse(fs.readFileSync(ORT, 'utf8')).daten; if (o) return o; } catch (e) {}
  const alt = path.join(APP, '..', 'daten');
  const ziel = fs.existsSync(path.join(alt, 'projekte')) ? path.resolve(alt) : path.join(os.homedir(), 'Documents', 'fabBoard');
  try { fs.mkdirSync(APPDATEN, { recursive: true }); fs.writeFileSync(ORT, JSON.stringify({ daten: ziel }, null, 1)); } catch (e) {}
  return ziel;
}
const DATEN = datenOrdnerFinden();
const PROJEKTE = path.join(DATEN, 'projekte');
const BACKUP = path.join(DATEN, '_backup');
const LAEUFE = path.join(DATEN, 'laeufe');
for (const d of [DATEN, PROJEKTE, BACKUP, LAEUFE]) fs.mkdirSync(d, { recursive: true });
// Die Regeln für die KI liegen im Programm; die KI bekommt eine Kopie im Datenordner (laeufe\ wird nicht synchronisiert),
// weil sie nur dort Zugriff hat und das Programm später in einem Archiv des Installers steckt
const AUFTRAG = path.join(LAEUFE, 'ki-auftrag.md');
fs.writeFileSync(AUFTRAG, fs.readFileSync(path.join(APP, 'claude-auftrag.md')));
// Einstellungen: daten/einstellungen.json (Vorlage: einstellungen.beispiel.json); fehlende Werte haben Standardwerte
const EDATEI = path.join(DATEN, 'einstellungen.json');
let E = {}; try { E = JSON.parse(fs.readFileSync(EDATEI, 'utf8')); } catch (e) {}
// anbieter/modell: gewählte KI aus dem Einrichtungs-Assistenten (anbieter.js); leer = Assistent erscheint beim Start
const EINSTELLUNGEN = { name: E.name || require('os').userInfo().username, projekteOrdner: E.projekteOrdner && fs.existsSync(E.projekteOrdner) ? E.projekteOrdner : (fs.existsSync(path.join(os.homedir(), 'Documents')) ? path.join(os.homedir(), 'Documents') : os.homedir()), datenOrdner: DATEN, anbieter: E.anbieter || '', modell: E.modell || '', sprache: E.sprache || '' };
// Neue Werte in einstellungen.json übernehmen; alle übrigen Felder bleiben
function einstellungenSpeichern(neu) {
  let alt = {}; try { alt = JSON.parse(fs.readFileSync(EDATEI, 'utf8')); } catch (e) {}
  fs.writeFileSync(EDATEI, JSON.stringify({ ...alt, ...neu }, null, 1));
  Object.assign(EINSTELLUNGEN, neu);
}
// Sprache (Deutsch/Englisch) für Server- und Anbietertexte: Einstellung „sprache“, leer = Systemsprache
const TX = require('./oberflaeche/texte.js');
const T = TX.T;
TX.setzeSprache(EINSTELLUNGEN.sprache);
const KI = require('./anbieter');
// Claude Code: fester Pfad aus den Einstellungen (Feld "claude"), sonst sucht anbieter.js im PATH und in %USERPROFILE%\.local\bin
const CLAUDE_PFAD = E.claude || '';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.log': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const mtime = (f) => Math.round(fs.statSync(f).mtimeMs);
// Erledigtes Archiv liegt in <id>.archiv.json (Claude liest nur die Hauptdatei); das Board bekommt es mitgeliefert
const mitMtime = (f) => { const a = f.slice(0, -5) + '.archiv.json'; return { ...JSON.parse(fs.readFileSync(f, 'utf8')), _mtime: mtime(f), ...(fs.existsSync(a) ? { _archivDatei: JSON.parse(fs.readFileSync(a, 'utf8')) } : {}) }; };
const projektdateien = () => fs.readdirSync(PROJEKTE).filter((n) => n.endsWith('.json') && !n.endsWith('.archiv.json'));
const senden = (res, code, obj) => { res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => ok(Buffer.concat(b))); });

function schreiben(f, id, daten, erwartet) {
  if (erwartet != null && fs.existsSync(f) && Math.abs(mtime(f) - erwartet) > 1) return [409, { konflikt: true, mtime: mtime(f) }];
  JSON.parse(daten.toString('utf8'));
  if (fs.existsSync(f)) {
    fs.copyFileSync(f, path.join(BACKUP, `${id}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
    const alte = fs.readdirSync(BACKUP).filter((n) => n.startsWith(id + '_')).sort();
    while (alte.length > 30) fs.unlinkSync(path.join(BACKUP, alte.shift()));
  }
  fs.writeFileSync(f + '.tmp', daten); fs.copyFileSync(f + '.tmp', f); fs.unlinkSync(f + '.tmp');
  return [200, { mtime: mtime(f) }];
}

// Handy-Sync: Ist daten\ ein Git-Repo (Einrichtung: "Handy-Sync einrichten.bat"), holt der PC beim Start und vor jedem Claude-Lauf
// die Änderungen vom Handy (git pull) und lädt nach dem Lauf hoch (git push). Protokoll: daten\laeufe\sync.log
const { spawn, spawnSync } = require('child_process');
const SYNC_LOG = path.join(LAEUFE, 'sync.log');
const jetztText = () => new Date().toLocaleString('sv-SE').slice(0, 19);
function gitLauf(args) {
  const r = spawnSync('git', ['-C', DATEN, ...args], { cwd: DATEN, encoding: 'utf8', timeout: 30000, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  const code = r.status == null ? -1 : r.status;
  const t = ((r.stdout || '') + (r.stderr || '')).trim();
  fs.appendFileSync(SYNC_LOG, `${jetztText()} git ${args.join(' ')} -> ${code}\r\n${t ? t + '\r\n' : ''}`);
  return code;
}
const jsonOk = () => fs.readdirSync(PROJEKTE).filter((n) => n.endsWith('.json')).every((n) => { try { JSON.parse(fs.readFileSync(path.join(PROJEKTE, n), 'utf8')); return true; } catch (e) { return false; } });
function sync(hochladen) {
  if (!fs.existsSync(path.join(DATEN, '.git'))) return;
  try {
    if (fs.existsSync(path.join(DATEN, '.git', 'MERGE_HEAD'))) gitLauf(['merge', '--abort']);
    gitLauf(['add', '-A']); gitLauf(['commit', '-q', '-m', 'PC ' + jetztText().slice(0, 16)]);
    if (gitLauf(['pull', '-q', '--no-rebase', '--no-edit']) !== 0) {
      gitLauf(['merge', '--abort']);
      // Konflikt (PC und Handy haben dieselbe Stelle geändert): an diesen Stellen gilt der PC-Stand; ergibt das kein gültiges JSON, bleibt alles wie vorher
      if (gitLauf(['pull', '-q', '--no-rebase', '--no-edit', '-X', 'ours']) === 0 && !jsonOk()) gitLauf(['reset', '-q', '--hard', 'ORIG_HEAD']);
    }
    if (hochladen) gitLauf(['push', '-q']);
  } catch (e) { try { fs.appendFileSync(SYNC_LOG, `Fehler: ${e.message}\r\n`); } catch (x) {} }
}

// "<KI> starten": ruft das Programm der gewählten KI (anbieter.js) im Projektordner auf, mit den Regeln aus claude-auftrag.md.
// Laufend: Läufe, die gerade arbeiten; Letzte: Ergebnis des letzten Laufs je Projekt (für die Anzeige im Board).
const LAUFEND = {};
const LETZTE = {};
// Opus, wenn etwas umzusetzen ist (Archiv umgesetzt:false, ausgefüllte Frage, Info mit Kommentar), sonst Sonnet
function modellWaehlen(j) {
  if ((j.archiv || []).some((a) => a && a.umgesetzt === false)) return 'opus';
  for (const t of j.themen || []) {
    if (!t || t.id === 'spaeter') continue;
    for (const e of t.items || []) {
      if (!e) continue;
      const kom = String(e.kommentar || '').trim();
      if (e.typ === 'frage' && (kom || (e.optionen || []).some((o) => o.gewaehlt === true))) return 'opus';
      if (e.typ === 'info' && kom) return 'opus';
    }
  }
  return 'sonnet';
}
// Für KIs, die selbst kein git dürfen (Codex): Commit im Projektordner, wenn es dort ein Git-Repo mit Änderungen gibt
function projektCommit(ordner, nachricht) {
  if (!fs.existsSync(path.join(ordner, '.git'))) return;
  const g = (args) => spawnSync('git', ['-C', ordner, ...args], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  g(['add', '-A']);
  if (g(['diff', '--cached', '--quiet']).status === 1) g(['commit', '-q', '-m', nachricht]);
}
async function claudeStarten(id) {
  if (LAUFEND[id]) return [409, { fehler: T('kiArbeitetSchon') }];
  sync(false);
  const f = path.join(PROJEKTE, id + '.json');
  if (!fs.existsSync(f)) return [404, { fehler: T('projektFehlt') }];
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!j.ordner || !fs.existsSync(j.ordner)) return [400, { fehler: T('projektordnerFehlt') }];
  const log = path.join(LAEUFE, id + '.log');
  const fehlerLog = path.join(LAEUFE, id + '.fehler.log');
  const prompt = `Arbeite das fabBoard-Projekt ${id} ab. Lies zuerst die Regeln in ${AUFTRAG} und befolge sie genau. Projektdatei: ${f}. Datenordner (Bildpfade „daten/…“ beginnen dort): ${DATEN}. Sprache für alle Texte im Board: ${T('spracheName')}.`;
  let b;
  LAUFEND[id] = { start: Date.now() }; // gegen Doppelklick, solange der Startbefehl ermittelt wird
  try { b = await KI.startBefehl(EINSTELLUNGEN.anbieter, { prompt, ordner: j.ordner, root: DATEN, modell: EINSTELLUNGEN.modell, claudeModell: modellWaehlen(j), claudePfad: CLAUDE_PFAD }); }
  catch (e) { return [400, { fehler: e.message }]; }
  finally { delete LAUFEND[id]; }
  if (b.gitSelbst) projektCommit(j.ordner, 'Stand vor fabBoard-Lauf');
  const [cmd, args, opt] = KI.aufruf(b.exe, b.args);
  const aus = fs.openSync(log, 'w'); const fe = fs.openSync(fehlerLog, 'w');
  let p;
  try { p = spawn(cmd, args, { ...opt, cwd: j.ordner, env: b.env, stdio: ['ignore', aus, fe], windowsHide: true }); }
  finally { fs.closeSync(aus); fs.closeSync(fe); }
  const start = Date.now();
  LAUFEND[id] = { start };
  const fertig = (code) => {
    if (!LAUFEND[id]) return;
    // KI und Modell als erste Zeile ins Protokoll
    try { fs.writeFileSync(log, `KI: ${b.text}\r\n\r\n` + fs.readFileSync(log, 'utf8')); } catch (e) {}
    if (b.gitSelbst) projektCommit(j.ordner, `fabBoard: Lauf mit ${b.text} ${jetztText().slice(0, 16)}`);
    LETZTE[id] = { start, ende: Date.now(), exit: code == null ? -1 : code }; delete LAUFEND[id];
    sync(true);
  };
  p.on('error', (e) => { try { fs.appendFileSync(fehlerLog, `KI konnte nicht starten: ${e.message}\r\n`); } catch (x) {} fertig(-1); });
  p.on('exit', fertig);
  return [200, { ok: true }];
}
function laufStand() {
  const st = {};
  for (const id in LETZTE) st[id] = { laeuft: false, ...LETZTE[id] };
  for (const id in LAUFEND) st[id] = { laeuft: true, start: LAUFEND[id].start };
  return st;
}

const server = http.createServer(async (req, res) => {
  try {
    if (PASSWORT) {
      const pw = Buffer.from((req.headers.authorization || '').replace(/^Basic /, ''), 'base64').toString().split(':').slice(1).join(':');
      if (pw !== PASSWORT) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="fabBoard"' }); return res.end(); }
    }
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    const erwartet = url.searchParams.has('mtime') ? Number(url.searchParams.get('mtime')) : null;
    if (p === '/api/alles' && req.method === 'GET') {
      const projekte = projektdateien().map((n) => mitMtime(path.join(PROJEKTE, n)));
      return senden(res, 200, { projekte });
    }
    // Sprache wählen: 'de', 'en' oder '' (= Systemsprache); gespeichert in einstellungen.json
    if (p === '/api/sprache' && req.method === 'POST') {
      const w = JSON.parse((await body(req)).toString('utf8') || '{}').sprache || '';
      if (!['', 'de', 'en'].includes(w)) return senden(res, 400, { fehler: T('unbekannt') });
      einstellungenSpeichern({ sprache: w }); TX.setzeSprache(w);
      return senden(res, 200, { ok: true, sprache: TX.sprache() });
    }
    if (p === '/api/einstellungen' && req.method === 'GET') {
      const a = KI.finde(EINSTELLUNGEN.anbieter);
      return senden(res, 200, { ...EINSTELLUNGEN, ki: a ? { id: a.id, name: a.name, kurz: a.kurz } : null });
    }
    // Einrichtungs-Assistent: Anbieter auflisten, prüfen, Schlüssel speichern, Wahl speichern.
    // Im Netzwerk (PORT gesetzt) gesperrt: KI-Wahl und Schlüssel ändert nur, wer direkt am Rechner sitzt.
    if (p.startsWith('/api/anbieter') && process.env.PORT) return senden(res, 403, { fehler: T('nurAmRechner') });
    if (p === '/api/anbieter' && req.method === 'GET') {
      return senden(res, 200, { gewaehlt: EINSTELLUNGEN.anbieter, modell: EINSTELLUNGEN.modell, anbieter: KI.ANBIETER.map(KI.oeffentlich) });
    }
    if (p === '/api/anbieter/wahl' && req.method === 'POST') {
      const w = JSON.parse((await body(req)).toString('utf8') || '{}');
      if (!KI.finde(w.anbieter)) return senden(res, 400, { fehler: T('anbieterUnbekannt') });
      einstellungenSpeichern({ anbieter: w.anbieter, modell: String(w.modell || '') });
      return senden(res, 200, { ok: true });
    }
    const mk = p.match(/^\/api\/anbieter\/([a-z0-9-]{1,40})\/(pruefung|schluessel)$/);
    if (mk) {
      if (!KI.finde(mk[1])) return senden(res, 404, { fehler: T('anbieterUnbekannt') });
      if (mk[2] === 'pruefung' && req.method === 'GET') return senden(res, 200, await KI.pruefen(mk[1], url.searchParams.get('modell') || '', CLAUDE_PFAD));
      if (mk[2] === 'schluessel' && (req.method === 'PUT' || req.method === 'DELETE')) {
        const w = req.method === 'PUT' ? JSON.parse((await body(req)).toString('utf8') || '{}').schluessel : '';
        if (req.method === 'PUT' && !String(w || '').trim()) return senden(res, 400, { fehler: T('schluesselLeer') });
        try { KI.schluesselSpeichern(mk[1], w); } catch (e) { return senden(res, 400, { fehler: e.message }); }
        return senden(res, 200, { ok: true });
      }
    }
    if (p === '/api/stand' && req.method === 'GET') {
      const st = {}; for (const n of projektdateien()) st[n.slice(0, -5)] = mtime(path.join(PROJEKTE, n));
      return senden(res, 200, st);
    }
    const m = p.match(/^\/api\/projekte\/([a-z0-9][a-z0-9-]{0,60})$/);
    if (m) {
      const f = path.join(PROJEKTE, m[1] + '.json');
      if (req.method === 'GET') return fs.existsSync(f) ? senden(res, 200, mitMtime(f)) : senden(res, 404, { fehler: T('nichtGefunden') });
      if (req.method === 'PUT') { const [c, o] = schreiben(f, m[1], await body(req), erwartet); return senden(res, c, o); }
      // Projekt löschen: <id>.json und <id>.archiv.json wandern nach daten/_backup/geloescht (nicht endgültig weg)
      if (req.method === 'DELETE') {
        if (LAUFEND[m[1]]) return senden(res, 409, { fehler: T('kiArbeitetSchon') });
        if (!fs.existsSync(f)) return senden(res, 404, { fehler: T('nichtGefunden') });
        const ziel = path.join(BACKUP, 'geloescht'); fs.mkdirSync(ziel, { recursive: true });
        const stempel = new Date().toISOString().replace(/[:.]/g, '-');
        fs.renameSync(f, path.join(ziel, `${m[1]}_${stempel}.json`));
        const a = path.join(PROJEKTE, m[1] + '.archiv.json');
        if (fs.existsSync(a)) fs.renameSync(a, path.join(ziel, `${m[1]}.archiv_${stempel}.json`));
        return senden(res, 200, { ok: true });
      }
    }
    const ma = p.match(/^\/api\/archiv\/([a-z0-9][a-z0-9-]{0,60})$/);
    if (ma && req.method === 'PUT') { const [c, o] = schreiben(path.join(PROJEKTE, ma[1] + '.archiv.json'), ma[1] + '.archiv', await body(req), null); return senden(res, c, o); }
    // Unterordner des Projekte-Ordners (Standard: Elternordner von fabBoard) zur Auswahl im Board
    if (p === '/api/ordner' && req.method === 'GET') {
      const basis = EINSTELLUNGEN.projekteOrdner;
      const ordner = fs.readdirSync(basis, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name).sort();
      return senden(res, 200, { basis, ordner });
    }
    if (p === '/api/claude' && req.method === 'GET') return senden(res, 200, laufStand());
    const mc = p.match(/^\/api\/claude\/([a-z0-9][a-z0-9-]{0,60})$/);
    if (mc && req.method === 'POST') {
      // Im Netzwerk erreichbar (PORT gesetzt) ohne Passwort: niemand von außen darf Claude starten
      if (process.env.PORT && !PASSWORT) return senden(res, 403, { fehler: T('nurMitPasswort') });
      const [c, o] = await claudeStarten(mc[1]); return senden(res, c, o);
    }
    if (p.startsWith('/api/')) return senden(res, 404, { fehler: T('unbekannt') });
    // Screenshots: in den Projektdaten als „daten/bilder/…“ gespeichert, liegen im Datenordner; alles andere aus app\oberflaeche
    const bild = p.startsWith('/daten/bilder/');
    const basis = bild ? path.join(DATEN, 'bilder') : OBERFLAECHE;
    const datei = path.normalize(path.join(basis, bild ? p.slice('/daten/bilder/'.length) : p === '/' ? 'index.html' : p));
    if (!datei.startsWith(basis + path.sep) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(T('nichtGefunden')); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(datei).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(datei).pipe(res);
  } catch (e) { senden(res, 500, { fehler: String(e.message) }); }
});
server.on('error', (e) => console.log(e.code === 'EADDRINUSE' ? `Port ${PORT} belegt – fabBoard läuft schon: http://localhost:${PORT}` : e.message));
server.listen(PORT, process.env.PORT ? '0.0.0.0' : '127.0.0.1', () => {
  sync(false);
  console.log(`fabBoard läuft: http://localhost:${PORT}`);
  // Im App-Fenster (Electron) keinen Browser öffnen – die App zeigt die Oberfläche selbst.
  if (process.platform === 'win32' && !process.env.PORT && !process.versions.electron) require('child_process').exec(`start "" http://localhost:${PORT}`);
});
