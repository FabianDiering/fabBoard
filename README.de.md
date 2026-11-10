# fabBoard

[English version](README.md)

fabBoard ist ein Board für den Desktop, mit dem du deine Projekte zusammen mit einem KI-Programmierassistenten bearbeitest – ohne Chat. Du sammelst je Projekt Fragen, Ideen, Anweisungen und Aufgaben. Die KI arbeitet sie selbstständig ab, fragt mit konkreten Optionen und einer Empfehlung zurück, und du entscheidest per Klick. Danach setzt sie um, was du entschieden hast.

- **Freie Wahl der KI:** Claude Code, OpenAI Codex, Gemini (Antigravity) oder Mistral (Vibe) mit deinem Konto, ein eigener API-Schlüssel (Anthropic, OpenAI, Google Gemini, Mistral) oder ein lokales Modell (Ollama, LM Studio).
- **Mehrere Projekte gleichzeitig:** Die KI kann in mehreren Projekten parallel arbeiten, je Projekt ein Lauf.
- **Deine Daten bleiben bei dir:** Projekte sind einfache JSON-Dateien in einem Ordner auf deinem Rechner (`Dokumente\fabBoard`). API-Schlüssel werden verschlüsselt auf deinem Rechner gespeichert.
- **Deutsch und Englisch:** richtet sich nach der Systemsprache, umstellbar in der Einrichtung.
- **Kostenlos und Open Source** (MIT-Lizenz). Wenn dir fabBoard hilft, freue ich mich über einen Kaffee: [ko-fi.com/fabboard](https://ko-fi.com/fabboard)

> **Stand: frühe Vorschau.** Einen Installer gibt es noch nicht; fabBoard läuft derzeit unter Windows aus dem Quellcode. Ein Windows-Installer und eine Mac-Fassung sind geplant.

## Voraussetzungen
- Windows 10 oder 11
- [Node.js](https://nodejs.org) (LTS)
- [Git](https://git-scm.com) – fabBoard legt vor und nach jedem KI-Lauf einen Commit an, so lässt sich jede Änderung rückgängig machen
- Mindestens ein KI-Assistent; fabBoard prüft, welche installiert und angemeldet sind, und zeigt dir die Befehle für Fehlendes

## Loslegen
```
git clone https://github.com/FabianDiering/fabBoard.git
cd fabBoard\app
npm install
npm start
```
Beim ersten Start hilft dir ein kurzer Einrichtungs-Assistent, deine KI zu wählen und startklar zu machen (installiert, angemeldet oder API-Schlüssel gespeichert). Über das Zahnrad oben rechts öffnest du ihn jederzeit wieder.

## So funktioniert es
1. Projekt anlegen und mit seinem Ordner auf deinem Rechner verbinden.
2. Einträge anlegen: Fragen, Ideen, Anweisungen, Aufgaben – oder einfach eine Nachricht schreiben.
3. Auf **Starten** klicken (der Knopf trägt den Namen deiner KI). Die KI arbeitet im Projektordner, macht aus Nachrichten Fragen mit Optionen, beantwortet deine Fragen und setzt Entschiedenes um.
4. Fragen per Klick entscheiden; Entschiedenes wandert ins Archiv und wird beim nächsten Lauf umgesetzt.

Die Regeln für die KI stehen in [`app/ki-auftrag.md`](app/ki-auftrag.md). Den Aufbau der Projektdateien beschreibt [`app/beispiel/DATENFORMAT.md`](app/beispiel/DATENFORMAT.md), dazu gibt es zwei Beispielprojekte auf Deutsch und Englisch.

## Code signing policy
Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

- **Team:** Autor, Prüfer und Freigabe: [Fabian Diering](https://github.com/FabianDiering) (Inhaber des Projekts). Änderungen von anderen werden vor dem Übernehmen geprüft.
- **Signierte Dateien:** nur der Windows-Installer und die Programmdateien, die der GitHub-Ablauf [`installer.yml`](.github/workflows/installer.yml) aus diesem Repository baut. Jede Version wird vor dem Signieren von Hand freigegeben.
- **Datenschutz:** Dieses Programm überträgt keine Informationen an andere Systeme im Netz, außer der Nutzer oder die Person, die es installiert oder bedient, verlangt es ausdrücklich. Insbesondere: Deine Projekte gehen nur an die gewählte KI, wenn du sie startest; nach Updates sucht fabBoard nur, wenn du es auslöst oder die automatische Suche einschaltest. Einzelheiten stehen in der Datenschutzerklärung in der App (Einstellungen → Funktionen → Datenschutz).

## Lizenz
MIT – siehe [LICENSE](LICENSE). © 2026 Fabian Diering
