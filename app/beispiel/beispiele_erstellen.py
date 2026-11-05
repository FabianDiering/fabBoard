# Erzeugt die fiktiven Beispielprojekte in app/beispiel/de und app/beispiel/en (gleicher Inhalt, zwei Sprachen).
# Sie zeigen alle Eintragsarten und dienen neuen Nutzern als Vorlage. Aufruf nach Änderungen: python beispiele_erstellen.py
# Aufbau der Dateien: siehe DATENFORMAT.md im selben Ordner.
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
TAG = '2026-11-05'


def eintrag(id, typ, titel, text='', optionen=(), mehrfach=False, kommentar='', von='claude', wer='fabian', quelle='', **extra):
    e = {'id': id, 'typ': typ, 'titel': titel, 'text': text,
         'optionen': [{'t': t, 'empf': empf, 'gewaehlt': gew} for t, empf, gew in optionen],
         'mehrfach': mehrfach, 'kommentar': kommentar, 'von': von, 'wer': wer, 'quelle': quelle, 'erstellt': TAG}
    e.update(extra)
    return e


def cafe(s):
    de = s == 'de'
    return {
        'id': 'beispiel-cafe' if de else 'example-cafe',
        'name': 'Beispiel: Website für ein Café' if de else 'Example: Website for a café',
        'art': 'Website',
        'beschreibung': 'Fiktives Beispiel: kleine Website für das Café „Morgenrot“ mit Öffnungszeiten und Karte.' if de
        else 'Fictional example: a small website for the café “Morning Glow” with opening hours and menu.',
        'ordner': '', 'reihenfolge': 90, 'erstellt': TAG, 'geaendert': TAG + ' 09:00',
        'themen': [
            {'id': 'allgemein', 'titel': 'Allgemein' if de else 'General', 'items': [
                eintrag('ib1', 'frage',
                        'Wie soll die Speisekarte erscheinen?' if de else 'How should the menu appear?',
                        'Die Karte ändert sich jede Woche. Als Webseite ist sie schnell aktuell, ein PDF sieht gedruckt besser aus.' if de
                        else 'The menu changes every week. As a web page it is quick to update; a PDF looks better in print.',
                        [('Als eigene Seite auf der Website' if de else 'As a page on the website', True, False),
                         ('Als PDF zum Herunterladen' if de else 'As a downloadable PDF', False, False),
                         ('Beides' if de else 'Both', False, False)], quelle='Nachricht ' + TAG if de else 'Message ' + TAG),
                eintrag('ib2', 'aufgabe',
                        'Fotos vom Café machen' if de else 'Take photos of the café',
                        'Drei bis fünf Fotos bei Tageslicht: Theke, Gastraum, ein Kuchen.' if de
                        else 'Three to five photos in daylight: counter, seating area, one cake.', von='fabian', wer='fabian'),
                eintrag('ib3', 'info',
                        'Was kostet eine eigene Domain?' if de else 'What does a domain cost?',
                        'Eine .de-Domain kostet meist 5 bis 15 € im Jahr. Mit „OK“ wandert diese Antwort ins Archiv.' if de
                        else 'A .com domain usually costs 10 to 20 a year. Click “OK” to move this answer to the archive.'),
            ]},
            {'id': 'gestaltung', 'titel': 'Gestaltung' if de else 'Design', 'items': [
                eintrag('ib4', 'idee',
                        'Farben aus dem Logo übernehmen' if de else 'Take the colours from the logo',
                        'Die KI macht daraus beim nächsten Lauf eine Frage mit Vorschlägen.' if de
                        else 'In the next run the AI turns this into a question with suggestions.', von='fabian', wer='claude'),
                eintrag('ib5', 'frage-an-claude',
                        'Welche Schrift passt zu einem Café?' if de else 'Which font suits a café?', von='fabian', wer='claude'),
            ]},
        ],
        'archiv': [
            {**eintrag('ib0', 'frage', 'Sprache der Website' if de else 'Language of the website', optionen=[
                ('Nur Deutsch' if de else 'English only', True, True), ('Deutsch und Englisch' if de else 'English and German', False, False)]),
             'themaId': 'allgemein', 'themaTitel': 'Allgemein' if de else 'General',
             'antwort': 'Nur Deutsch' if de else 'English only', 'erledigtAm': TAG, 'umgesetzt': True,
             'ergebnis': 'Seitentexte auf Deutsch angelegt (index.html).' if de else 'Page texts created in English (index.html).'},
        ],
        'nachrichten': [
            {'id': 'mb2', 'text': 'Bitte noch einen Link zu Google Maps ergänzen.' if de else 'Please also add a link to Google Maps.',
             'erstellt': TAG + ' 10:15', 'von': 'fabian', 'status': 'offen', 'antwort': ''},
            {'id': 'mb1', 'text': 'Öffnungszeiten: Di–So 8–18 Uhr' if de else 'Opening hours: Tue–Sun 8 am–6 pm',
             'erstellt': TAG + ' 08:40', 'von': 'fabian', 'status': 'erledigt',
             'antwort': '1 Punkt im Thema Allgemein angelegt.' if de else '1 item created in topic General.'},
        ],
    }


def film(s):
    de = s == 'de'
    return {
        'id': 'beispiel-kurzfilm' if de else 'example-shortfilm',
        'name': 'Beispiel: Kurzfilm planen' if de else 'Example: Planning a short film',
        'art': 'Film',
        'beschreibung': 'Fiktives Beispiel: Planung eines 10-minütigen Kurzfilms mit Drehorten und Zeitplan.' if de
        else 'Fictional example: planning a 10-minute short film with locations and schedule.',
        'ordner': '', 'reihenfolge': 91, 'erstellt': TAG, 'geaendert': TAG + ' 09:00',
        'themen': [
            {'id': 'drehorte', 'titel': 'Drehorte' if de else 'Locations', 'items': [
                eintrag('ik1', 'frage',
                        'Welche Drehorte kommen in Frage?' if de else 'Which locations are possible?',
                        'Mehrfachauswahl: Alle passenden Orte anklicken, die KI fragt dann die Genehmigungen ab.' if de
                        else 'Multiple choice: tick every suitable place, the AI then looks into the permits.',
                        [('Bahnhofshalle' if de else 'Station hall', True, False), ('Park am Fluss' if de else 'Riverside park', True, False),
                         ('Leeres Ladenlokal' if de else 'Empty shop', False, False)], mehrfach=True),
                eintrag('ik2', 'anweisung',
                        'Drehgenehmigungen für Bahnhöfe recherchieren' if de else 'Research filming permits for stations',
                        von='fabian', wer='claude'),
            ]},
            {'id': 'spaeter', 'titel': 'Später' if de else 'Later', 'items': [
                eintrag('ik3', 'idee', 'Making-of-Video' if de else 'Making-of video',
                        'Liegt in „Später“: Die KI überspringt dieses Thema, bis der Punkt zurückgeholt wird.' if de
                        else 'Parked in “Later”: the AI skips this topic until the item is moved back.',
                        von='fabian', wer='claude', herkunft={'id': 'drehorte', 'titel': 'Drehorte' if de else 'Locations'}),
            ]},
        ],
        'archiv': [],
        'nachrichten': [],
    }


for s in ('de', 'en'):
    ordner = os.path.join(HIER, s)
    os.makedirs(ordner, exist_ok=True)
    for p in (cafe(s), film(s)):
        with open(os.path.join(ordner, p['id'] + '.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump(p, f, ensure_ascii=False, indent=1)
        print(s, p['id'])
