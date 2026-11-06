// Brücke zwischen den Screenshot-Fenstern (screenshot-auswahl.html, screenshot.html) und der App (main.js).
// Die Fenster bekommen nur diese vier Befehle, keinen Zugriff auf Node.js oder Dateien.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('fabShot', {
  bild: () => ipcRenderer.invoke('shot:bild'),          // Bild als data:-Adresse
  waehlen: (r) => ipcRenderer.send('shot:wahl', r),     // gewählter Bereich {x, y, width, height} oder null = ganzer Bildschirm
  abbrechen: () => ipcRenderer.send('shot:abbruch'),
  fertig: (x) => ipcRenderer.send('shot:fertig', x),    // {info, markiert}
});
