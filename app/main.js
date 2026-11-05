// fabBoard als Desktop-App (Electron). Startpunkt: "npm.cmd start" im Ordner app.
// Zeigt die bestehende fabBoard-Oberfläche (index.html) in einem eigenen Fenster statt im Browser.
const { app, BrowserWindow, shell } = require('electron');
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
  fenster.loadURL(ADRESSE);
}

app.whenReady().then(fensterOeffnen);
app.on('window-all-closed', () => app.quit());
