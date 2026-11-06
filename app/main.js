// fabBoard als Desktop-App (Electron). Startpunkt: "npm.cmd start" im Ordner app.
// Zeigt die bestehende fabBoard-Oberfläche (index.html) in einem eigenen Fenster statt im Browser.
const { app, BrowserWindow, Menu, shell } = require('electron');
const net = require('net');
const path = require('path');

const PORT = 4747;
const ADRESSE = `http://localhost:${PORT}`;

// Prüft, ob der fabBoard-Server schon läuft (z. B. eine zweite App-Instanz).
function serverLaeuft() {
  return new Promise((ok) => {
    const s = net.connect(PORT, '127.0.0.1');
    s.once('connect', () => { s.end(); ok(true); });
    s.once('error', () => ok(false));
  });
}

async function fensterOeffnen() {
  // Läuft noch kein Server, startet die App ihren server.js (im selben Ordner) selbst mit.
  if (!(await serverLaeuft())) require(path.join(__dirname, 'server.js'));

  const fenster = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'fabBoard',
    icon: path.join(__dirname, 'icon.ico'), // Symbol in der Taskleiste und oben links im Fenster
    autoHideMenuBar: true,
  });
  // Links nach außen (z. B. Websites) im normalen Browser öffnen, nicht im App-Fenster.
  fenster.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  rechtschreibung(fenster.webContents);
  fenster.loadURL(ADRESSE);
}

// Rechtschreibprüfung: Prüfsprache folgt der Board-Sprache (<html lang>), Rechtsklick zeigt Vorschläge und Bearbeiten-Befehle.
// Texte direkt aus TEXTE, nicht über setzeSprache(), weil server.js dieselbe Sprachdatei nutzt.
function rechtschreibung(wc) {
  const { TEXTE } = require(path.join(__dirname, 'oberflaeche', 'texte.js'));
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
    const t = (k) => TEXTE[l][k] ?? TEXTE.de[k];
    const vorlage = [];
    if (p.misspelledWord) {
      for (const v of p.dictionarySuggestions.slice(0, 5)) vorlage.push({ label: v, click: () => wc.replaceMisspelling(v) });
      if (!p.dictionarySuggestions.length) vorlage.push({ label: t('rsKeineVorschlaege'), enabled: false });
      vorlage.push({ label: t('rsWoerterbuch'), click: () => wc.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: 'separator' });
    }
    const f = p.editFlags;
    if (p.isEditable) vorlage.push({ label: t('rsAusschneiden'), role: 'cut', enabled: f.canCut });
    if (p.isEditable || p.selectionText) vorlage.push({ label: t('kopieren'), role: 'copy', enabled: f.canCopy });
    if (p.isEditable) vorlage.push({ label: t('rsEinfuegen'), role: 'paste', enabled: f.canPaste }, { type: 'separator' }, { label: t('rsAllesMarkieren'), role: 'selectAll' });
    if (vorlage.length) Menu.buildFromTemplate(vorlage).popup({ window: BrowserWindow.fromWebContents(wc) });
  });
}

app.whenReady().then(fensterOeffnen);
app.on('window-all-closed', () => app.quit());
