# Demo-Bestellmodus · lokaler Testbericht

Stand 06.11.2026, Branch `demo-order-mode`. Die Prüfungen gelten für die lokale Arbeitskopie und ihren Produktionsbuild.

## Katalog und simulierte Preise

Alle 67 Shop-Artikel bleiben sichtbar. Die separate Konfiguration `src/config/demoPrices.ts` führt die 56 freigegebenen Shop-IDs als `DEMO_STANDARD`. Nur in der Simulation gilt für sie **DEMO-PREIS CHF 25.00 pro Flasche**. Die beiden gleichnamigen Grüner Veltliner besitzen weiterhin getrennte IDs. Jede weitere oder neu importierte ID ist standardmässig gesperrt.

Die übrigen elf Artikel sind reine Ansichtsprodukte: Magnum 1093086, Eiswein 1093010, Pauillac-Holzkiste 1092979, Creme Melone 1092969, Marillenlikör 1092967, Pineau 1092965, Ruby Port 1092986, Gin 1092975, Grappa 1092973, Rum 1092971 und der unklare Artikel `oenm45` 1093105. Die Holzkiste bleibt von Pauillac Einzel 1092977 getrennt.

Die Simulation bestätigt weder ein Flaschenvolumen noch ein tatsächliches Verkaufsgebinde. Die offiziellen Preisfelder im Snapshot bleiben leer. Nur für den Grappa sind 70 cl bestätigt. Unklare Rohwerte, widersprüchliche Herkunfts- und Jahrgangsangaben sowie fehlende Daten je Produkt stehen im [Katalogbericht](PRODUKTKATALOG.md). Für `oenm45` erscheint ein Platzhalter. Alle 66 vorhandenen Produktbilder wurden im Browsertest dekodiert.

## Bedienung und Grenzen

Demo-Flaschen können sortenrein oder gemischt zu positiven Vielfachen von sechs zusammengestellt werden. Ein 6er-Karton kostet in der Simulation CHF 150.00, ein 12er CHF 300.00. Für diesen Festpreis gibt es keinen zusätzlichen Mengenrabatt. Der Abschluss übernimmt Messe und Tablet aus der Zuordnung sowie Verkäufer und Kunde aus lokalen Demolisten. Das Formular bietet weder Neukundenanlage noch Freitextnotizen. Gespeicherte Aufträge tragen `mode: SIMULATION`, ihre Positionen `priceSource: DEMO-PREIS`. Es gibt keinen Belegexport, Zahlungs- oder Versandvorgang.

„Demo-Daten zurücksetzen“ entfernt nach Bestätigung nur den lokalen Demo-Warenkorb, die gespeicherten Demo-Bestellungen und die Verkäuferauswahl dieses Browsers. Die Bestellung übermittelt keine Daten an externe Systeme. Produktbilder und andere Seitenassets werden unabhängig vom Bestellvorgang geladen. Für den Pages-Build liegen `noindex, nofollow` im HTML und `robots.txt` im Buildverzeichnis. Bei einer Projektseite unter einem Unterpfad liegt der Robots-Standardpfad auf Ebene der Domain; die HTML-Anweisung gilt direkt für die Demo.

## Prüfergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` | Alle vier Suiten bestanden, einschliesslich Katalog, Mischkartons, Messekontext, Speicherung, Idempotenz und Reset. |
| `npm run build` | TypeScript und Vite-Produktionsbuild erfolgreich. |
| Katalog und Klassifizierung | 67 eindeutige Artikel, 56 simulierbar, 11 gesperrt. Keine Mutation der offiziellen Preis-, Volumen- oder Gebindefelder. |
| Preise und Kartons | Gemischte 6er und 12er zu CHF 150.00 bzw. 300.00. Ungültige Menge und Sonderartikel zurückgewiesen. |
| Speicherung und Wiederholung | Wiederholter gleicher Abschluss erzeugt eine Bestellung. Abweichender Inhalt beim gleichen Schlüssel wird abgelehnt. Schreibfehler erlauben einen erfolgreichen Retry. |
| Netzwerkgrenze | Der getestete Checkout-Einstieg löste keinen Aufruf von Fetch, XHR, WebSocket oder Beacon aus. Der Browsertest überwachte zusätzlich die Requests während Abschluss und Retry. |
| `python test/verify_demo_browser.py` | Erfolgreich mit Playwright und isoliertem Headless Edge bei 1024 × 768. Der lokale Build wurde aus `dist/` bedient. Externe Requests waren blockiert. |

Der Browsertest öffnete Produktdetails, wählte zwei Sorten zu je sechs Flaschen, einen synthetischen Kunden und den zweiten Demo-Verkäufer. Beim ersten Speichern wurde ein Schreibfehler ausgelöst. Nach „Erneut versuchen“ standen genau eine Simulation über CHF 300.00 sowie der richtige Verkäufer in der Historie. Anschliessend wurde die Demo über die Oberfläche zurückgesetzt. Die Prüfung betrifft einen lokalen Browser und simulierte Tablet-Abmessungen. Es erfolgten kein Push und kein Deployment.
