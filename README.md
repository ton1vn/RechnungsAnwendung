# BlumenHaus RechnungsAnwendung

Eine einfache lokale Web-App zum Erstellen von Rechnungen fuer ein Blumengeschaeft.

## Starten

```bash
cd /Users/toninguyen/Desktop/Rechnungen/RechnungsAnwendung
python3 -m http.server 4173
```

Danach im Browser oeffnen:

```text
http://localhost:4173/index.html
```

## Funktionen

- Kunden speichern und wieder auswaehlen
- Optionale Steuerangabe pro Kunde: keine, StNr. oder USt.ID
- Produktvorschlaege speichern
- Automatische Positionen und Summen
- Netto-, MwSt.- und Brutto-Berechnung mit 7 Prozent
- Druck- und PDF-Ausgabe ueber den Browser
