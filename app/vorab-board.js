// Brücke zwischen dem Board (index.html) und der App (main.js), nur in der Desktop-App.
// Das Board bekommt nur diese Befehle, keinen Zugriff auf Node.js oder Dateien.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('fabApp', {
  ordnerWaehlen: (start) => ipcRenderer.invoke('app:ordner', start), // Ordner-Auswahl von Windows/macOS; Ergebnis: Pfad oder ''
  neuStarten: () => ipcRenderer.send('app:neustart'),               // App neu starten (z. B. nach Wechsel des Datenordners)
  mac: process.platform === 'darwin',                                // für die Schreibweise des Screenshot-Kürzels
});
