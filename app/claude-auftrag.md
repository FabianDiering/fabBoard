# fabBoard-Auftrag für die KI (Claude Code, Codex, Gemini …)

Du wurdest aus fabBoard gestartet, ohne Chat. Niemand schaut zu, und du kannst nicht nachfragen. Fragen stellst du ausschließlich über das Board. Antworte im Board immer in der Sprache, die im Startbefehl steht (Deutsch oder Englisch), kurz und knapp.

Dein Arbeitsverzeichnis ist der Projektordner. Die Projektdatei liegt im fabBoard-Datenordner unter `projekte\<id>.json` (Pfade von Projektdatei und Datenordner stehen im Startbefehl).

## Datenformat der Projektdatei
`{id, name, art, beschreibung, ordner, reihenfolge, themen:[{id, titel, items:[…]}], archiv:[…], nachrichten:[…]}`

- Eintrag: `{id, typ: frage|frage-an-claude|anweisung|idee|aufgabe|info, titel, text, optionen:[{t, empf, gewaehlt}], mehrfach, kommentar, von, wer: fabian|claude, quelle, erstellt}`
- Archiv-Eintrag zusätzlich: `{themaId, themaTitel, antwort, erledigtAm, umgesetzt}`. `umgesetzt: false` heißt: der Nutzer hat entschieden, die Umsetzung wartet auf dich.
- Nachricht: `{id, text, erstellt, von, status: offen|erledigt, antwort, bild}`. Optional `bild`: Pfad eines Screenshots; `daten/` steht für den Datenordner aus dem Startbefehl (z. B. `daten/bilder/<id>/<datei>.png` = `<Datenordner>\bilder\<id>\<datei>.png`). Sieh dir das Bild mit Read an, bevor du die Nachricht bearbeitest.
- Erledigte Archiv-Einträge (`umgesetzt: true`) verschiebt das Board nach `<id>.archiv.json`. Diese Datei liest du nur, wenn du ältere Entscheidungen wirklich brauchst; du schreibst nie hinein.
- IDs: neue Einträge bekommen `"i"` + Zeitstempel/Zufall (z. B. `i20261024a1`), neue Themen eine kurze Slug-ID. `erstellt` = `YYYY-MM-DD`, `von: "claude"`.

## Planungsdokument `plan.md`
- Jedes Projekt hat im Projektordner eine eigene `plan.md` mit Entscheidungen, Recherche-Ergebnissen und To-do-Liste. Lies sie zu Beginn jedes Laufs, falls vorhanden.
- Wird etwas entschieden oder umgesetzt, das die Planung betrifft, schreibst du `plan.md` fort (Punkt abhaken, Entscheidung ergänzen, Stand-Datum). Fehlt die Datei, legst du sie dann an.
- **Genau ein Plan je Projekt.** `plan.md` ist der einzige Plan (Entscheidungen, Fahrplan, To-do-Liste). Zwei nebeneinander existierende Pläne sind ein Konflikt und zu vermeiden, weil sie auseinanderlaufen. Lege daher nie eine zweite Plan-, Fahrplan- oder To-do-Datei an; neue Schritte, Ideen und Aufgaben kommen als Punkte in `plan.md`. PDFs oder andere Ansichten des Plans werden nur aus `plan.md` erzeugt und nie getrennt gepflegt.
- Findest du im Projekt eine zweite Plan-Datei (z. B. `*ToDos*.md`, `roadmap.md`, ein älterer Fahrplan): Konflikt. Nichts daraus umsetzen, sondern im Board eine Frage stellen, ob sie in `plan.md` zusammengeführt werden soll (Empfehlung: zusammenführen, Erledigtes abhaken, Überholtes als ersetzt markieren, alte Datei danach löschen).

## Was du abarbeitest, in dieser Reihenfolge

### 0. Ausgefüllte Fragen gelten als entschieden
- Ein Eintrag `typ: frage` in `themen`, bei dem mindestens eine Option `gewaehlt: true` ist oder `kommentar` nicht leer ist, ist entschieden – auch ohne „Ja“-Klick.
- Verschiebe ihn ins Archiv: aus `items` entfernen, vorne in `archiv` einfügen mit `themaId`, `themaTitel`, `antwort` (Text der gewählten Option(en), sonst leer), `erledigtAm` (heute), `umgesetzt: false`. Alle übrigen Felder bleiben.
- Themen sind vorübergehend: Wird ein Thema dadurch leer, löschst du es (außer „Allgemein“). Brauchst du es später wieder (z. B. für eine Rückfrage), legst du es neu an.
- Fragen ohne Auswahl und ohne Kommentar bleiben stehen. `info`-Einträge mit Kommentar behandelst du wie eine Anweisung (Kommentar umsetzen).
- Danach mit Schritt 1 weitermachen.

### 1. Entschiedene Punkte umsetzen (Archiv, `umgesetzt: false`)
- Setze genau das um, was in `antwort` (gewählte Option) und `kommentar` steht. Nicht mehr. Sagt der Kommentar „bleibt so“ o. Ä., nichts ändern, nur `umgesetzt: true`.
- Vor der ersten Änderung: `git add -A` und `git commit -m "Stand vor fabBoard-Lauf"` (nur wenn es Änderungen gibt). Nach jedem umgesetzten Punkt ein eigener Commit, Nachricht: `fabBoard: <Titel>`.
- Nur im Projekt fabBoard: Alles, was zu fabBoard gehört, folgt dem fabBoard-Brandbook (`daten\intern\fabBoard Brandbook.pdf`, Werte in `daten\intern\brandbook_pdf.py`): Dokumente (PDF, HTML-Berichte, Anleitungen) ebenso wie jede Oberfläche der App (Board, Dialoge, Einrichtungs-Assistent, Handy-Seite). PDFs nutzen dafür `daten\intern\fabboard_stil.py`, die App die CSS-Variablen in `app\oberflaeche\index.html`. Orange nur für den Logo-Punkt und „aktiv/arbeitet“, Grün nur für den Start-Knopf.
- Nur im Projekt fabBoard: Hat der Lauf Code geändert, erhöhe die Versionsnummer in `app\oberflaeche\index.html` (`id="version"`, zweite Stelle um 1, z. B. v1.0 → v1.1, v1.9 → v1.10) einmal pro Lauf, im letzten Commit des Laufs.
- Danach `umgesetzt: true` setzen und ein Feld `ergebnis` mit 1–2 Sätzen ergänzen (was geändert wurde, welche Dateien).
- Ist die Entscheidung unklar oder widersprüchlich: nichts ändern, stattdessen eine neue Frage im Thema anlegen und im Archiv-Eintrag `ergebnis` = „Rückfrage gestellt“ setzen.

### 2. Neue Nachrichten (`nachrichten`, `status: offen`) und Einträge `wer: claude` vom Typ `anweisung` oder `idee`
- Nur analysieren, **keinen Code ändern**. Du darfst Dateien lesen, im Web recherchieren und Recherche-Ergebnisse ins Board schreiben.
- Zerlege die Nachricht in einzelne Punkte. Lege fehlende Themen an (z. B. „Hauptseite“, „Meine Sammlung“, „Drehorte“, „Zeitleiste“, „Neuer Eintrag“, „Design“, „Recherche“, „Technik“).
- Für jeden Punkt ein Eintrag `typ: "frage"`, `wer: "fabian"`, `quelle: "Nachricht <Datum>"`:
  - `titel`: der Punkt in wenigen Worten
  - `text`: deine Einschätzung (was du vorfindest, Aufwand, Risiken), 2–4 Sätze
  - `optionen`: 2–4 konkrete Lösungswege, genau einer mit `empf: true`
- Reine Informationsfragen des Nutzers beantwortest du als `typ: "info"`, `wer: "fabian"`, Antwort in `text`.
- Danach: Nachricht `status: "erledigt"`, `antwort`: 1 Satz, wie viele Punkte in welchen Themen liegen. Bearbeitete `anweisung`/`idee`-Einträge löschst du aus `items`, wenn sie vollständig in Fragen überführt sind.

### 3. Einträge `typ: frage-an-claude`
- Antwort in `text` ergänzen (Absatz „Antwort: …“), dann `typ: "info"`, `wer: "fabian"`.

## Regeln
- Das Thema „Später“ (`id: spaeter`) überspringst du in allen Schritten. Das Feld `herkunft` an Einträgen bleibt unverändert.
- Lies die Projektdatei unmittelbar vor dem Schreiben frisch ein und schreibe sie als gültiges JSON (UTF-8, ohne BOM) zurück. Alle Felder, die du nicht bearbeitest, bleiben unverändert. Setze `geaendert` auf `YYYY-MM-DD HH:MM`.
- Ändere Code ausschließlich in Schritt 1 und ausschließlich im Projektordner.
- Nichts löschen außer den oben genannten Board-Einträgen. Keine Pakete installieren, nichts veröffentlichen, kein `git push`.
- In den Unterordner `entwuerfe` im Projektordner kommen nur grafische Entwürfe (Layouts, Oberflächen, Muster). Fehlt der Ordner, legst du ihn an. Jeden neuen Entwurf öffnest du nach dem Anlegen im Standardbrowser (PowerShell: `Start-Process "<Pfad zur Datei>"`).
- Berichte, Analysen und Recherche-Ergebnisse als Dokument speicherst du direkt im Projektordner, nicht in `entwuerfe`.
- Jedes neu angelegte HTML-Dokument (Entwürfe, Berichte, Prüflisten usw.) öffnest du nach dem Anlegen im Standardbrowser, in allen Projekten.
- Gibt es nichts zu tun, beende dich ohne Änderung.
- Am Ende: eine kurze Zusammenfassung auf Deutsch ausgeben (landet im Protokoll).
