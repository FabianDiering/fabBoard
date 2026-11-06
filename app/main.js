// fabBoard als Desktop-App (Electron). Startpunkt: "npm.cmd start" im Ordner app.
// Zeigt die fabBoard-Oberfläche (index.html) in einem eigenen Fenster, dazu App-Menü, Symbol im Infobereich und Screenshot (Strg+Alt+S).
const { app, BrowserWindow, Menu, Tray, Notification, globalShortcut, desktopCapturer, screen, clipboard, nativeImage, ipcMain, dialog, shell, systemPreferences } = require('electron');
const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.FABBOARD_PORT) || 4747;
const ADRESSE = `http://localhost:${PORT}`;
const ICON = path.join(__dirname, 'icon.ico');
const VORAB = path.join(__dirname, 'vorab.js'); // Brücke für die Screenshot-Fenster (nur die nötigen Befehle, kein Node.js)
const KUERZEL = 'CommandOrControl+Alt+S';
const KUERZEL_TEXT = process.platform === 'darwin' ? '⌘⌥S' : 'Strg+Alt+S';
const REPO = 'https://github.com/FabianDiering/fabBoard';
const SPENDEN = /^https:\/\//.test(require('./package.json').spendenLink || '') ? require('./package.json').spendenLink : ''; // „Spendier einen Kaffee“ (Ko-fi)
const SICHER = { contextIsolation: true, nodeIntegration: false, sandbox: true };
// Zum Testen neben der laufenden App: eigener Einstellungsordner, damit die Sperre gegen eine zweite Instanz nicht greift
if (process.env.FABBOARD_PROFIL) app.setPath('userData', process.env.FABBOARD_PROFIL);

const { TEXTE } = require(path.join(__dirname, 'oberflaeche', 'texte.js'));
let sprache = 'de';
const t = (k, v) => { let s = TEXTE[sprache][k] ?? TEXTE.de[k] ?? k; if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] ?? m)); return s; };

let fenster = null;
let tray = null;
let beenden = false;

// Prüft, ob der fabBoard-Server schon läuft (z. B. aus einer Entwicklungssitzung).
function serverLaeuft() {
  return new Promise((ok) => {
    const s = net.connect(PORT, '127.0.0.1');
    s.once('connect', () => { s.end(); ok(true); });
    s.once('error', () => ok(false));
  });
}
const api = (p, opt) => fetch(ADRESSE + p, { cache: 'no-store', ...opt }).then((r) => r.json());
const kiName = async () => { try { return (await api('/api/einstellungen')).ki?.kurz || 'KI'; } catch (e) { return 'KI'; } };

async function fensterOeffnen() {
  // Läuft noch kein Server, startet die App ihren server.js (im selben Ordner) selbst mit.
  if (!(await serverLaeuft())) require(path.join(__dirname, 'server.js'));

  fenster = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'fabBoard',
    icon: ICON, // Symbol in der Taskleiste und oben links im Fenster
    autoHideMenuBar: true, // Menü erscheint mit Alt, damit das Board ruhig bleibt
    // Sicherheit: Die Oberfläche bekommt keinen Zugriff auf Node.js oder das Dateisystem (Electron-Standard, hier ausdrücklich)
    webPreferences: { ...SICHER, preload: path.join(__dirname, 'vorab-board.js') }, // Brücke: Ordnerwahl und Neustart
  });
  // Links nach außen (z. B. Websites) im normalen Browser öffnen, nicht im App-Fenster; nur Web- und Mail-Adressen,
  // keine Dateien oder Programme (file:, ms-…: usw.). Das Fenster selbst bleibt immer beim Board.
  const nachAussen = (url) => { if (/^(https?:|mailto:)/i.test(url)) shell.openExternal(url); };
  fenster.webContents.setWindowOpenHandler(({ url }) => { nachAussen(url); return { action: 'deny' }; });
  fenster.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ADRESSE + '/') && url !== ADRESSE) { e.preventDefault(); nachAussen(url); } });
  rechtschreibung(fenster.webContents);
  // Schließen = im Hintergrund weiterlaufen (Infobereich), damit das Screenshot-Kürzel weiter geht; Beenden über Menü oder Infobereich
  fenster.on('close', (e) => {
    if (beenden) return;
    e.preventDefault(); fenster.hide();
    hintergrundHinweis();
  });
  fenster.loadURL(ADRESSE);
}
function zeigen() { if (!fenster) return; if (fenster.isMinimized()) fenster.restore(); fenster.show(); fenster.focus(); }
// Beim ersten Schließen einmal erklären, dass fabBoard weiterläuft (Merkdatei im Einstellungsordner der App)
function hintergrundHinweis() {
  const merk = path.join(app.getPath('userData'), 'hintergrund-hinweis');
  if (fs.existsSync(merk)) return;
  try { fs.mkdirSync(path.dirname(merk), { recursive: true }); fs.writeFileSync(merk, ''); } catch (e) {}
  melden(t('hintergrundT'), t('hintergrund', { kuerzel: KUERZEL_TEXT }));
}
function melden(titel, text) {
  if (Notification.isSupported()) new Notification({ title: titel, body: text, icon: ICON }).show();
  else dialog.showMessageBox({ type: 'info', title: 'fabBoard', message: titel, detail: text });
}

// Board-Sprache (<html lang>) bestimmt Menü- und Screenshot-Texte; Menü wird neu gebaut, sobald sie wechselt
async function boardSprache() {
  try { return (await fenster.webContents.executeJavaScript('document.documentElement.lang')) === 'en' ? 'en' : 'de'; } catch (e) { return sprache; }
}
async function spracheAbgleichen() {
  const l = await boardSprache();
  if (l === sprache && Menu.getApplicationMenu()) return;
  sprache = l; menueBauen(); trayBauen();
}

// ---------- Menü: Datei, Bearbeiten, Ansicht, Hilfe (auf dem Mac zusätzlich das App-Menü)
function imBoard(js) { zeigen(); fenster.webContents.executeJavaScript(js).catch(() => {}); }
async function ordnerOeffnen(unter) {
  try { const d = (await api('/api/einstellungen')).datenOrdner; if (d) shell.openPath(unter ? path.join(d, unter) : d); } catch (e) {}
}
async function ueber() {
  let v = ''; try { v = await fenster.webContents.executeJavaScript("document.getElementById('version').textContent"); } catch (e) {}
  dialog.showMessageBox(fenster, { type: 'none', icon: nativeImage.createFromPath(ICON), title: t('mUeber'), message: `fabBoard ${v}`.trim(), detail: t('mUeberText'), buttons: ['OK'] });
}
function menueBauen() {
  const mac = process.platform === 'darwin';
  const vorlage = [
    ...(mac ? [{ role: 'appMenu' }] : []),
    { label: t('mDatei'), submenu: [
      { label: t('mScreenshot'), accelerator: KUERZEL, registerAccelerator: false, click: screenshot },
      { type: 'separator' },
      { label: t('einstellungen'), accelerator: 'CommandOrControl+,', click: () => imBoard("document.getElementById('eKnopf').click()") },
      { label: t('mDatenordner'), click: () => ordnerOeffnen('') },
      { type: 'separator' },
      { label: t('mFensterZu'), accelerator: 'CommandOrControl+W', click: () => fenster.close() },
      { label: t('mBeenden'), accelerator: 'CommandOrControl+Q', click: allesBeenden },
    ] },
    { label: t('mBearbeiten'), submenu: [
      { label: t('rueckgaengig'), role: 'undo' }, { label: t('mWiederholen'), role: 'redo' }, { type: 'separator' },
      { label: t('rsAusschneiden'), role: 'cut' }, { label: t('kopieren'), role: 'copy' }, { label: t('rsEinfuegen'), role: 'paste' },
      { label: t('rsAllesMarkieren'), role: 'selectAll' },
    ] },
    { label: t('mAnsicht'), submenu: [
      { label: t('mNeuLaden'), accelerator: 'CommandOrControl+R', click: () => fenster.webContents.reload() },
      { type: 'separator' },
      { label: t('mOriginal'), role: 'resetZoom' }, { label: t('mGroesser'), role: 'zoomIn', accelerator: 'CommandOrControl+=' }, { label: t('mKleiner'), role: 'zoomOut' },
      { type: 'separator' },
      { label: t('mVollbild'), role: 'togglefullscreen' },
      // Entwicklerwerkzeuge nur beim Start aus dem Quellcode, nicht in der installierten App
      ...(app.isPackaged ? [] : [{ type: 'separator' }, { label: t('mEntwickler'), role: 'toggleDevTools' }]),
    ] },
    { label: t('mHilfe'), submenu: [
      { label: t('mGithub'), click: () => shell.openExternal(REPO) },
      { label: t('mFehlerMelden'), click: () => shell.openExternal(REPO + '/issues') },
      ...(SPENDEN ? [{ label: t('spenden'), click: () => shell.openExternal(SPENDEN) }] : []),
      { label: t('mProtokolle'), click: () => ordnerOeffnen('laeufe') },
      { type: 'separator' },
      { label: t('impressum'), click: () => imBoard("document.getElementById('impK').click()") },
      ...(app.isPackaged ? [{ label: t('updSuchen'), click: () => updatesPruefen(true) }] : []),
      { label: t('mUeber'), click: ueber },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(vorlage));
}

// ---------- Symbol im Infobereich: Board öffnen, Screenshot, Beenden
function trayBauen() {
  if (!tray) { tray = new Tray(ICON); tray.setToolTip('fabBoard'); tray.on('click', zeigen); }
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: t('mBoardOeffnen'), click: zeigen },
    { label: `${t('mScreenshot')}  (${KUERZEL_TEXT})`, click: screenshot },
    { type: 'separator' },
    { label: t('mBeenden'), click: allesBeenden },
  ]));
}
function allesBeenden() { beenden = true; app.quit(); }

// ---------- Screenshot: alle Bildschirme aufnehmen, Bereich wählen, markieren, als Nachricht ans Board
// Ablauf: 1. desktopCapturer nimmt jeden Bildschirm in voller Auflösung auf. 2. Je Bildschirm ein randloses Fenster mit dem
// eingefrorenen Bild (screenshot-auswahl.html), dort Bereich ziehen. 3. Ausschnitt im Markier-Fenster (screenshot.html).
// 4. Speichern über server.js (POST /api/screenshot/<id>), markierte Fassung in die Zwischenablage, Bestätigung als Mitteilung.
const SHOT = { aktiv: false, auswahl: new Map(), bild: null, editor: null };
async function screenshot() {
  if (SHOT.aktiv) return;
  SHOT.aktiv = true;
  try {
    await spracheAbgleichen();
    if (process.platform === 'darwin' && systemPreferences.getMediaAccessStatus('screen') === 'denied') { melden('fabBoard', t('sMacRecht')); return shotEnde(); }
    const anzeigen = screen.getAllDisplays();
    const gross = anzeigen.reduce((m, d) => ({ width: Math.max(m.width, Math.round(d.bounds.width * d.scaleFactor)), height: Math.max(m.height, Math.round(d.bounds.height * d.scaleFactor)) }), { width: 1, height: 1 });
    const quellen = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: gross });
    anzeigen.forEach((d, i) => {
      const q = quellen.find((x) => String(x.display_id) === String(d.id)) || quellen[i];
      if (!q || q.thumbnail.isEmpty()) return;
      const soll = { width: Math.round(d.bounds.width * d.scaleFactor), height: Math.round(d.bounds.height * d.scaleFactor) };
      let bild = q.thumbnail;
      const ist = bild.getSize();
      if (ist.width !== soll.width || ist.height !== soll.height) bild = bild.resize(soll);
      auswahlFenster(d, bild);
    });
    if (!SHOT.auswahl.size) { if (process.platform === 'darwin') melden('fabBoard', t('sMacRecht')); shotEnde(); }
  } catch (e) { melden('fabBoard', t('sFehler', { fehler: e.message })); shotEnde(); }
}
function auswahlFenster(d, bild) {
  const w = new BrowserWindow({
    ...d.bounds, frame: false, show: false, resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    skipTaskbar: true, alwaysOnTop: true, hasShadow: false, enableLargerThanScreen: true, backgroundColor: '#000000',
    webPreferences: { ...SICHER, preload: VORAB },
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.setBounds(d.bounds); // nötig bei Bildschirmen mit unterschiedlicher Skalierung
  const id = w.webContents.id;
  SHOT.auswahl.set(id, { w, d, bild });
  w.once('ready-to-show', () => {
    w.show();
    const maus = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    if (maus.id === d.id) w.focus();
  });
  w.on('closed', () => SHOT.auswahl.delete(id));
  w.loadURL(ADRESSE + '/screenshot-auswahl.html');
}
function auswahlZu() { for (const { w } of SHOT.auswahl.values()) if (!w.isDestroyed()) w.destroy(); SHOT.auswahl.clear(); }
function shotEnde() { auswahlZu(); SHOT.bild = null; SHOT.editor = null; SHOT.aktiv = false; }
const alsDaten = (bild, art) => art === 'jpg' ? 'data:image/jpeg;base64,' + bild.toJPEG(90).toString('base64') : bild.toDataURL();

// Ausschnitt gewählt (r in Fensterkoordinaten, null = ganzer Bildschirm) → Markier-Fenster
function editorOeffnen(bild, d) {
  SHOT.bild = bild;
  const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea || d.workArea;
  const breite = Math.min(940, wa.width - 40), hoehe = Math.min(780, wa.height - 40);
  const w = new BrowserWindow({
    x: Math.round(wa.x + (wa.width - breite) / 2), y: Math.round(wa.y + (wa.height - hoehe) / 2), width: breite, height: hoehe,
    minWidth: 640, minHeight: 480, title: 'fabBoard – Screenshot', icon: ICON, alwaysOnTop: true, show: false, minimizable: false,
    webPreferences: { ...SICHER, preload: VORAB },
  });
  w.setMenu(null);
  SHOT.editor = w;
  w.once('ready-to-show', () => { w.show(); w.focus(); });
  w.on('closed', () => { if (SHOT.editor === w) shotEnde(); });
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  w.webContents.on('will-navigate', (e) => e.preventDefault());
  rechtschreibung(w.webContents);
  w.loadURL(ADRESSE + '/screenshot.html');
}

ipcMain.handle('shot:bild', (e) => {
  const a = SHOT.auswahl.get(e.sender.id);
  if (a) return alsDaten(a.bild, 'jpg'); // nur zur Anzeige; ausgeschnitten wird aus dem Original
  if (SHOT.editor && e.sender === SHOT.editor.webContents && SHOT.bild) return alsDaten(SHOT.bild, 'png');
  return null;
});
ipcMain.on('shot:wahl', (e, r) => {
  const a = SHOT.auswahl.get(e.sender.id);
  if (!a) return;
  let bild = a.bild;
  if (r && r.width > 2 && r.height > 2) {
    const k = bild.getSize().width / a.d.bounds.width; // Bildpunkte je Fensterpunkt (Anzeigeskalierung)
    const g = bild.getSize();
    const x = Math.max(0, Math.round(r.x * k)), y = Math.max(0, Math.round(r.y * k));
    bild = bild.crop({ x, y, width: Math.min(g.width - x, Math.round(r.width * k)), height: Math.min(g.height - y, Math.round(r.height * k)) });
  }
  const d = a.d;
  auswahlZu();
  editorOeffnen(bild, d);
});
// Board: Ordner wählen (Datenordner) und App neu starten; nur vom Hauptfenster aus
ipcMain.handle('app:ordner', async (e, start) => {
  if (!fenster || e.sender !== fenster.webContents) return '';
  const r = await dialog.showOpenDialog(fenster, { title: t('datenordner'), defaultPath: start || app.getPath('documents'), properties: ['openDirectory', 'createDirectory'] });
  return r.canceled || !r.filePaths[0] ? '' : r.filePaths[0];
});
ipcMain.on('app:neustart', (e) => {
  if (!fenster || e.sender !== fenster.webContents) return;
  beenden = true; app.relaunch(); app.quit();
});
ipcMain.on('shot:abbruch', (e) => {
  if (SHOT.auswahl.has(e.sender.id)) return shotEnde();
  if (SHOT.editor && e.sender === SHOT.editor.webContents) SHOT.editor.close();
});
// Gespeichert: markierte Fassung in die Zwischenablage, Mitteilung, Fenster zu
ipcMain.on('shot:fertig', (e, x) => {
  if (!SHOT.editor || e.sender !== SHOT.editor.webContents) return;
  if (x && x.markiert) { try { clipboard.writeImage(nativeImage.createFromDataURL(x.markiert)); } catch (er) {} }
  if (x && x.info) melden('fabBoard', x.info);
  SHOT.editor.close();
  if (fenster) fenster.webContents.executeJavaScript('typeof abgleich === "function" && abgleich()').catch(() => {});
});

// ---------- Updates (nur in der installierten App): electron-updater lädt neue Versionen von GitHub Releases im Hintergrund,
// danach fragt fabBoard, ob es jetzt neu starten soll; sonst wird beim nächsten Beenden installiert. Fehler (offline usw.) bleiben still,
// außer der Nutzer hat selbst über „Hilfe → Nach Updates suchen“ geprüft.
let AU = null;
function updater() {
  if (AU || !app.isPackaged || process.env.FABBOARD_PROFIL) return AU;
  try { AU = require('electron-updater').autoUpdater; } catch (e) { return null; }
  AU.autoDownload = true; AU.autoInstallOnAppQuit = true;
  AU.on('error', () => {});
  AU.on('update-downloaded', async (info) => {
    const r = await dialog.showMessageBox(fenster && fenster.isVisible() ? fenster : undefined, { type: 'info', title: 'fabBoard', icon: nativeImage.createFromPath(ICON),
      message: t('updT', { version: info.version }), detail: t('upd'), buttons: [t('updJetzt'), t('updSpaeter')], defaultId: 0, cancelId: 1 });
    if (r.response === 0) { beenden = true; AU.quitAndInstall(true, true); }
  });
  return AU;
}
async function updatesPruefen(vonHand) {
  const au = updater();
  if (!au) return;
  try {
    const r = await au.checkForUpdates();
    const neu = r && r.isUpdateAvailable;
    if (vonHand && !neu) dialog.showMessageBox(fenster, { type: 'info', title: 'fabBoard', message: t('updAktuell', { version: app.getVersion() }) });
    if (vonHand && neu) melden('fabBoard', t('updLaedt', { version: r.updateInfo.version }));
  } catch (e) { if (vonHand) dialog.showMessageBox(fenster, { type: 'warning', title: 'fabBoard', message: t('updFehler', { fehler: e.message.split('\n')[0] }) }); }
}

// Rechtschreibprüfung: Prüfsprache folgt der Board-Sprache (<html lang>), Rechtsklick zeigt Vorschläge und Bearbeiten-Befehle.
// Texte direkt aus TEXTE, nicht über setzeSprache(), weil server.js dieselbe Sprachdatei nutzt.
function rechtschreibung(wc) {
  const boardSprache = () => wc.executeJavaScript('document.documentElement.lang').catch(() => 'de');
  async function pruefspracheSetzen() {
    const l = (await boardSprache()) === 'en' ? 'en' : 'de';
    const da = wc.session.availableSpellCheckerLanguages || [];
    const wahl = da.filter((x) => x.toLowerCase().split('-')[0] === l);
    try { wc.session.setSpellCheckerLanguages(wahl.length ? wahl.slice(0, 1) : [l === 'de' ? 'de-DE' : 'en-US']); } catch (e) {}
    return l;
  }
  // Die Sprache steht erst fest, wenn das Board seine Einstellungen geladen hat; danach bei jedem Fokus und Rechtsklick nachziehen.
  wc.on('did-finish-load', () => setTimeout(pruefspracheSetzen, 1500));
  wc.on('focus', pruefspracheSetzen);
  wc.on('context-menu', async (e, p) => {
    const l = await pruefspracheSetzen();
    const tt = (k) => TEXTE[l][k] ?? TEXTE.de[k];
    const vorlage = [];
    if (p.misspelledWord) {
      for (const v of p.dictionarySuggestions.slice(0, 5)) vorlage.push({ label: v, click: () => wc.replaceMisspelling(v) });
      if (!p.dictionarySuggestions.length) vorlage.push({ label: tt('rsKeineVorschlaege'), enabled: false });
      vorlage.push({ label: tt('rsWoerterbuch'), click: () => wc.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: 'separator' });
    }
    const f = p.editFlags;
    if (p.isEditable) vorlage.push({ label: tt('rsAusschneiden'), role: 'cut', enabled: f.canCut });
    if (p.isEditable || p.selectionText) vorlage.push({ label: tt('kopieren'), role: 'copy', enabled: f.canCopy });
    if (p.isEditable) vorlage.push({ label: tt('rsEinfuegen'), role: 'paste', enabled: f.canPaste }, { type: 'separator' }, { label: tt('rsAllesMarkieren'), role: 'selectAll' });
    if (vorlage.length) Menu.buildFromTemplate(vorlage).popup({ window: BrowserWindow.fromWebContents(wc) });
  });
}

// Nur eine fabBoard-App gleichzeitig; ein zweiter Start holt das vorhandene Fenster nach vorn
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', zeigen);
  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('fabBoard'); // Absendername der Mitteilungen
    menueBauen(); trayBauen();
    await fensterOeffnen();
    fenster.webContents.on('did-finish-load', () => setTimeout(spracheAbgleichen, 1500));
    fenster.on('focus', spracheAbgleichen);
    // Tastenkürzel gilt systemweit, solange fabBoard läuft (auch im Hintergrund)
    if (!globalShortcut.register(KUERZEL, screenshot)) setTimeout(() => melden('fabBoard', t('kuerzelBelegt', { kuerzel: KUERZEL_TEXT })), 3000);
    // Updates: kurz nach dem Start und dann alle 6 Stunden
    setTimeout(() => updatesPruefen(false), 15000);
    setInterval(() => updatesPruefen(false), 6 * 60 * 60 * 1000);
  });
  app.on('before-quit', () => { beenden = true; });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => {}); // App bleibt im Infobereich; beendet wird über das Menü
  app.on('activate', zeigen); // Mac: Klick aufs Dock-Symbol
}
module.exports = { screenshot, SHOT };
