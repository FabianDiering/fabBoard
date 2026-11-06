# Regeln für KIs, die an fabBoard selbst arbeiten

Diese Datei gilt für jede KI (Claude Code, Codex, Antigravity …), die am Programm fabBoard arbeitet, im Board-Lauf ebenso wie im Chat. `CLAUDE.md` verweist hierher. Die allgemeinen Regeln für Board-Läufe in allen Projekten stehen in `app/ki-auftrag.md`.

## Aufbau
- Electron-App im Ordner `app`: `main.js` (Fenster, Menü, Infobereich, Screenshot), `server.js` (lokaler Server, Daten, KI-Start), `anbieter.js` (KI-Anbieter), `vorab.js` (Brücke für die Screenshot-Fenster), Oberflächen in `app/oberflaeche`. Start aus dem Quellcode: im Ordner `app` `npm start`.
- Die Daten der Nutzer liegen nicht im Programm, sondern im Datenordner (Aufbau: `app/beispiel/DATENFORMAT.md`). Der Ordner `daten` hier ist privat und kommt nie ins Repo.
- Falls vorhanden, liegen Plan (`daten/intern/plan.md`), Brandbook und weitere private Unterlagen in `daten/intern/`. Den Plan zu Beginn einer Planungsaufgabe lesen und bei Entscheidungen fortschreiben; keine zweite Plan- oder To-do-Datei anlegen.

## Beim Ändern
- **Zwei Sprachen:** Jeder sichtbare Text steht in `app/oberflaeche/texte.js`, auf Deutsch und Englisch; im Code nur `T('schluessel')`.
- **Modellunabhängig:** In der Oberfläche nie fest „Claude“ schreiben, sondern den Namen der gewählten KI. Die gespeicherten Werte `fabian`/`claude` (`von`, `wer`, `frage-an-claude`) bleiben als Rollen, damit bestehende Projekte funktionieren.
- **Aussehen nach Brandbook:** Farben, Schriften und Knöpfe wie die CSS-Variablen in `app/oberflaeche/index.html`, Hell und Dunkel. Orange nur für den Logo-Punkt und „aktiv/arbeitet“, Grün nur für den Start-Knopf. Dokumente (PDF, HTML-Berichte, Anleitungen) folgen ebenfalls dem Brandbook; PDFs nutzen `daten/intern/fabboard_stil.py`, Werte in `daten/intern/brandbook_pdf.py` (falls vorhanden).
- **Versionsnummer:** Wer Code ändert, erhöht die Version in `app/oberflaeche/index.html` (`id="version"`, zweite Stelle um 1, z. B. v1.9 → v1.10), einmal je Lauf bzw. Änderung, im letzten Commit.
- **Sicherheit:** Fenster mit `contextIsolation`, `sandbox`, ohne Node-Zugriff; der Server nimmt nur Anfragen von localhost und vom eigenen Origin an; keine Anfragen nach außen (Schriften liegen lokal), keine Telemetrie.
- **Commits:** eine Änderung, ein Commit; Nachricht `fabBoard: <was> (vX.Y)`. Vor jedem Push `python daten/intern/vor_push_pruefen.py` (falls vorhanden), damit nichts Privates ins öffentliche Repo kommt.
