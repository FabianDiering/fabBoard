# fabBoard

[English version](README.md)

**Das Entscheidungsboard zwischen dir und deiner KI.** Ein Board für alle deine Projekte: Die KI arbeitet an mehreren Projekten gleichzeitig, fragt dich, und du entscheidest.

fabBoard ist ein kostenloses Programm, mit dem du deine Projekte zusammen mit einem KI-Modell deiner Wahl bearbeitest – ohne Chat und ohne Technikkenntnisse. Jedes Projekt (z. B. eine Website, ein Text, eine Recherche, ein Programm) hat sein eigenes Board und seinen eigenen Ordner. Du schreibst einen Auftrag und startest die KI per Klick; während sie an einem Projekt arbeitet, startest du sie schon am nächsten. Statt im Chatfenster auf dich zu warten, legt die KI ihre Fragen mit konkreten Antwortmöglichkeiten und einer Empfehlung ins Board. Du antwortest, wann es dir passt, Projekt für Projekt, und die KI setzt danach um, was du entschieden hast.

- **Mehrere Projekte gleichzeitig, in einem Fenster:** Die KI arbeitet parallel an mehreren Projekten, je Projekt ein Lauf. Du behältst den Überblick und entscheidest dort, wo es nötig ist.
- **Du entscheidest, die KI arbeitet:** Fragen, Ideen, Anweisungen und Aufgaben sammeln sich je Projekt im Board. Jede Entscheidung triffst du, und sie bleibt nachvollziehbar.
- **Freie Wahl der KI, je Projekt:** Claude, ChatGPT (Codex), Gemini oder Mistral mit deinem eigenen Konto, ein eigener API-Schlüssel (Anthropic, OpenAI, Google Gemini, Mistral) oder ein Modell auf deinem eigenen Rechner (Ollama, LM Studio). Verschiedene Projekte können nebeneinander verschiedene KIs nutzen.
- **Einrichtung ohne Vorwissen:** fabBoard installiert das offizielle KI-Programm per Knopf und hilft bei der Anmeldung. Bei Claude und ChatGPT (Codex) meldest du dich einfach im Browser an, ganz ohne Terminal.
- **Deine Daten bleiben bei dir:** Projekte sind einfache JSON-Dateien in einem Ordner auf deinem Rechner (`Dokumente\fabBoard`). API-Schlüssel werden verschlüsselt auf deinem Rechner gespeichert.
- **Deutsch und Englisch:** richtet sich nach der Systemsprache, jederzeit umstellbar.
- **Kostenlos und Open Source** (MIT-Lizenz). Wenn dir fabBoard hilft, freue ich mich über einen Kaffee: [ko-fi.com/fabboard](https://ko-fi.com/fabboard)

> **Stand: Vorabversion für Windows.** fabBoard wird gerade mit ersten Nutzern getestet. Eine Mac-Fassung ist geplant.

## Herunterladen und installieren
1. Unter [Releases](https://github.com/FabianDiering/fabBoard/releases) die neueste Datei `fabBoard-Setup-….exe` herunterladen.
2. Doppelklick auf die Datei. fabBoard installiert sich ohne weitere Fragen und ohne Administratorrechte und startet von selbst.
3. Ein kurzer Einrichtungs-Assistent hilft dir, deine KI zu wählen, sie zu installieren und dich anzumelden. Alles geht per Knopf, du musst nichts abtippen.

Solange der Installer noch nicht signiert ist, zeigt Windows eine Warnung („Der Computer wurde durch Windows geschützt“). Weiter geht es mit „Weitere Informationen“ und „Trotzdem ausführen“. Auf Rechnern, auf denen die Intelligente App-Steuerung von Windows eingeschaltet ist, lässt sich die Vorabversion bis zur Signatur leider gar nicht installieren.

## Voraussetzungen
- Windows 10 oder 11
- Ein Konto bei einer KI (z. B. Claude oder ChatGPT), ein eigener API-Schlüssel oder ein lokales Modell. Weitere Programme brauchst du nicht, fabBoard holt alles Nötige selbst.

## Für Entwickler: Aus dem Quellcode starten
Dafür brauchst du [Node.js](https://nodejs.org) (LTS):
```
git clone https://github.com/FabianDiering/fabBoard.git
cd fabBoard\app
npm install
npm start
```

## So funktioniert es
1. Projekt anlegen und mit seinem Ordner auf deinem Rechner verbinden.
2. Einträge anlegen: Fragen, Ideen, Anweisungen, Aufgaben – oder einfach eine Nachricht schreiben.
3. Auf **Starten** klicken (der Knopf trägt den Namen deiner KI). Die KI arbeitet im Projektordner, macht aus Nachrichten Fragen mit Optionen, beantwortet deine Fragen und setzt Entschiedenes um.
4. Fragen per Klick entscheiden; Entschiedenes wandert ins Archiv und wird beim nächsten Lauf umgesetzt.

Die Regeln für die KI stehen in [`app/ki-auftrag.md`](app/ki-auftrag.md). Den Aufbau der Projektdateien beschreibt [`app/beispiel/DATENFORMAT.md`](app/beispiel/DATENFORMAT.md), dazu gibt es ein Übungsprojekt und zwei Beispielprojekte auf Deutsch und Englisch.

## Code signing policy
Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

- **Team:** Autor, Prüfer und Freigabe: [Fabian Diering](https://github.com/FabianDiering) (Inhaber des Projekts). Änderungen von anderen werden vor dem Übernehmen geprüft.
- **Signierte Dateien:** nur der Windows-Installer und die Programmdateien, die der GitHub-Ablauf [`installer.yml`](.github/workflows/installer.yml) aus diesem Repository baut. Jede Version wird vor dem Signieren von Hand freigegeben.
- **Datenschutz:** Dieses Programm überträgt keine Informationen an andere Systeme im Netz, außer der Nutzer oder die Person, die es installiert oder bedient, verlangt es ausdrücklich. Insbesondere: Deine Projekte gehen nur an die gewählte KI, wenn du sie startest; nach Updates sucht fabBoard nur, wenn du es auslöst oder die automatische Suche einschaltest. Einzelheiten stehen in der [Datenschutzerklärung](PRIVACY.md#datenschutz), dieselbe steht auch in der App (Einstellungen → Funktionen → Datenschutz).

## Lizenz
MIT – siehe [LICENSE](LICENSE). © 2026 Fabian Martin Diering
