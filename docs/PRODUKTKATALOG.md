# Kaisergarten – Produktkatalog

**Lokaler Branch `demo-order-mode`:** Die Angaben unten beschreiben den ursprünglichen Katalogimport. Für die aktuelle Simulation gelten die Preis- und Bestellregeln im [Testbericht Demo-Bestellmodus](DEMO-BESTELLMODUS-TESTBERICHT.md). Die offiziellen Stammdaten und ihre dort dokumentierten Lücken gelten weiterhin.

Stand der Quelldaten und Abschlussprüfung: 06.11.2026. Nur lokale Integration; kein Push und kein Deployment.

## Umfang und Herkunft

67 öffentlich gelistete Artikel mit 67 eindeutigen Shop-IDs und Produktlinks wurden aus fünf Ergebnisseiten (16 + 16 + 16 + 16 + 3) und ihren Detailseiten erfasst. Quelle: https://kaisergarten-weine.ch/shop/ . Der redundante Link auf die erste Seite wurde bei der Zählung normalisiert.

66 offizielle Produktbilder liegen lokal unter `public/images/products/kg-<Shop-ID>.png`. Original- und Download-URL stehen je Artikel in `src/data/products.json`. Vorhandene verkleinerte Website-Varianten werden bevorzugt; keine fremden Ersatzbilder. Darstellung mit `object-contain`, Lazy Loading und neutralem Platzhalter. Bei Artikel 1093105 („oenm45“) fehlt das Originalbild. Die lokalen PNG-Signaturen und positiven Bildabmessungen wurden automatisiert geprüft; eine visuelle Prüfung aller Bildzuordnungen ist nicht abgeschlossen.

`src/data/products.json` enthält belegte Stammdaten und Rohattribute, Herkunftslinks, Datenhinweise und leere Werte für fehlende oder ungeklärte Angaben. Beschreibungen sind kurze redaktionelle Zusammenfassungen der Detailseiten, keine vollständigen Textkopien. `src/data/catalog.ts` adaptiert den Snapshot für das bestehende Wine-Modell. `src/data/mockWines.ts` exportiert nur noch diesen echten Katalog. Eine spätere zentrale Datenquelle kann am Adapter angeschlossen werden; keine MeWare-Anbindung implementiert.

## Kategorien

| Kategorie | Artikel |
| --- | ---: |
| Weissweine | 22 |
| Rotweine | 29 |
| Roséweine | 4 |
| Schaumweine | 4 |
| Dessertweine / Liköre | 4 |
| Spirituosen | 3 |
| Weitere Artikel / ungeklärt | 1 |

## Fehlende oder ungeklärte Angaben

Die Zahlen beziehen sich auf leere normalisierte Felder im lokalen Snapshot, nicht ausschliesslich auf fehlende Website-Angaben. Widersprüche werden nicht stillschweigend korrigiert. Rohwerte bleiben nachvollziehbar. Unbekannte Preise sind `null`, niemals null Franken.

| Feld | Artikel ohne bestätigten Wert |
| --- | ---: |
| Preis | 67 |
| Jahrgang | 12 |
| Rebsorte | 7 |
| Land | 3 |
| Region | 41 |
| Flaschengrösse | 66 |
| Alkohol (exakt) | 65 |
| Geschmack | 7 |
| Restzucker | 10 |
| Säure | 8 |
| Beschreibung | 1 |
| Bestellgebinde | 67 |

Bei Pineau 1092965 nennt die Quelle ungefähr 17 % Vol.; diese Näherung bleibt als `alcoholNote` erhalten. Ein exakter Alkoholwert wird daraus nicht erfunden. Bestandsmengen und Kartonpreise fehlen für sämtliche Artikel. Zusätzliche nicht erfasste Angaben wie Auszeichnungen, strukturierte Degustationsnotizen oder Lagerpotenzial werden nicht erfunden.

## Bestellablauf und Preise

**Aktuell kann mit keinem der 67 Katalogartikel ein Demo-Bestellabschluss vorgeführt werden.** Es fehlen sämtliche Preise und bestätigte Bestellgebinde. Die Sperre ist eine bewusste Konsequenz der Datenlage; damit ist die aktuelle Anwendung eine Katalogpräsentation und noch keine vollständig vorführbare Verkaufsdemo.

Die bisherige Warenkorb-, Checkout-, Speicher- und Rundungslogik bleibt vorhanden. Karten und Details sperren die Aufnahme; `CartContext` prüft zusätzlich Preis und Gebinde. Die Bestellvalidierung lehnt fehlende/ungültige Preise und ungeklärte Gebinde ebenfalls ab. Sonderprodukte, Spirituosen, Magnum und Kisten werden nicht ungeprüft als Standardflaschen gezählt. Die bestehende Regel (positive Vielfache von sechs, einschliesslich Mischkartons) bleibt erhalten.

Beim Laden gespeicherter Warenkörbe werden alte Demo-IDs und nicht bestellbare Produkte entfernt; Preise stammen aus dem aktuellen Katalog, nicht aus alten Browser-Snapshots. Das kann einen früheren Demo-Warenkorb leeren und ist beabsichtigt. Bereits gespeicherte Bestellungen bleiben historische Snapshots; sie werden nicht umgeschrieben. Die Erfolgsmeldung folgt weiterhin erst auf bestätigte lokale Speicherung. Wiederholte Aufrufe werden durch die bestehende Idempotenzprüfung abgesichert.

### Vorbereitete Trennung von echten und Demo-Preisen

- Echte Produktdaten und gegebenenfalls später belegte Verkaufspreise: `src/data/products.json` (`priceCHF`, `casePriceCHF`). Aktuell beide leer.
- Separate Vorbereitung: `src/config/demoPrices.ts`, mit `productId`, `demoUnitPriceCHF`, `demoCasePriceCHF`, fester Herkunft `priceSource: 'demo'` und Kennzeichnung „Demopreis – kein Verkaufspreis“.
- Die Demo-Konfiguration ist **leer, deaktiviert und nicht in die Preisberechnung eingebunden**. Es wurden keine Preise eingetragen. Auch ein blosses Umschalten von `enabled` aktiviert aktuell keine Demo-Bestellungen.
- Vor einer später ausdrücklich freigegebenen Aktivierung: Werte und Demo-Gebinde je Artikel bestätigen; Preisauflösung ergänzen, ohne Originalfelder zu überschreiben; Demo-Kennzeichnung in Karten, Details, Warenkorb, Checkout und Bestellhistorie durchgängig anzeigen; Preisquelle samt Betrag im Bestellsnapshot sichern. Historische Bestellungen dürfen bei Änderungen nicht neu bewertet werden.
- Ein Demo-Preis allein bestätigt weder Flaschenvolumen noch Standardkartonfähigkeit. Unbekannte Gebinde bleiben gesperrt. Es entstehen weiterhin keine echten Bestellungen.

## Dubletten, Varianten und Datenkonflikte

Die IDs 1092963 und 1093094 haben denselben Namen „DKNK Reserve Grüner Veltliner 2023“, aber unterschiedliche offizielle Produktlinks. Beide bleiben erhalten; ob eine Dublette vorliegt, muss der Betreiber klären. Magnum 1093086 und regulärer Cabernet/Merlot 1093084 sind separate Artikel. Pauillac-Einzelartikel 1092977 und Sechser-Holzkiste 1092979 bleiben ebenfalls getrennt; die Quelle verwendet für beide dasselbe Kistenbild.

Artikelbezogene Hinweise aus dem Snapshot:

- **1093030 – Comedus Grauer Burgunder Baden**: Restzucker widersprüchlich: Tabelle 3,9 g/l, Beschreibung 2,5 g/l. Normalisierter Wert bleibt leer.
- **1092969 – Creme Melone Likör**: Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1093068 – D`Artagnan Scheurebe sweet**: Zucker: unklar formatiert (6-4-g/Ltr), nicht als Zahl übernommen.
- **1093012 – DKNK Reserve Chardonnay 2022**: Quelle bezeichnet 22 g/l Restzucker als trocken. Geschmacksangabe ungeklärt.
- **1092963 – DKNK Reserve Grüner Veltliner 2023**: Gleichnamiger Shopartikel 1093094; eigenständige Shop-ID, Dublette nicht bestätigt.
- **1093094 – DKNK Reserve Grüner Veltliner 2023**: Gleichnamiger Shopartikel 1092963; eigenständige Shop-ID, Dublette nicht bestätigt.
- **1092975 – Gin Armstrong Berries**: Herkunft widersprüchlich: Tabelle Deutschland, Beschreibung England. Land bleibt leer. Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1093038 – Kaiser Amaranto Rouge**: Quelle bezeichnet 44 g/l Restzucker als trocken. Geschmacksangabe ungeklärt.
- **1092973 – Kaiser Grappa Amarone Barrique**: Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1092967 – Marillenlikör**: Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1092977 – Memoire Pauillac Einzel**: Quelle zeigt beim Einzelartikel dasselbe Kistenbild wie bei Artikel 1092979.
- **1092980 – NIER Merlot Reserve**: Jahrgang widersprüchlich: Tabelle 2023, Beschreibung 2022. Jahrgang bleibt leer.
- **1093105 – oenm45**: Öffentlich gelisteter Artikel ohne Detaildaten und ohne Originalbild; Artikelbezeichnung prüfen.
- **1093014 – Petite Le Jus Reserve**: Quelle bezeichnet 22 g/l Restzucker als trocken. Geschmacksangabe ungeklärt.
- **1093082 – Pigalle Blanc Spätlese**: Zucker: unklar formatiert (7-0-g-Ltr), nicht als Zahl übernommen.
- **1092965 – Pineau V. De Romanet**: Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1092986 – Ruby Port Naravo**: Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.
- **1092971 – Rum Bailando XO Caribean**: Herkunft widersprüchlich: Tabelle JM, Beschreibung Anguilla. Land bleibt leer. Restzucker 0 in Quelle als möglicher Platzhalter: Bestätigung nötig. Säure 0 in Quelle als möglicher Platzhalter: Bestätigung nötig.

## Vollständiges Artikelverzeichnis

Für **alle folgenden 67 Artikel fehlen Preis und bestätigtes Bestellgebinde**. Die letzte Spalte nennt weitere leere normalisierte Felder. „Lokal“ bezeichnet die oben beschriebene offizielle Bilddatei.

| Shop-ID | Produkt / Originalquelle | Kategorie | Bild | Weitere fehlende / ungeklärte Felder |
| --- | --- | --- | --- | --- |
| 1093072 | [„Der Filius“  – Jungwein](https://kaisergarten-weine.ch/product/der-filius-jungwein/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093088 | [Amarone della Valpolicella D.O.C.G](https://kaisergarten-weine.ch/product/amarone-della-valpolicella-d-o-c-g/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093034 | [Antelucano Piemonte Selezione Speciale](https://kaisergarten-weine.ch/product/antelucano-piemonte-selezione-speciale/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093018 | [Bearfoot White Zinfandel](https://kaisergarten-weine.ch/product/bearfoot-white-zinfandel/) | Roséweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093054 | [Champagne Bernard Dessacy Rose Premier Cru](https://kaisergarten-weine.ch/product/champagne-bernard-dessacy-rose-premier-cru/) | Schaumweine | Lokal | Jahrgang, Flaschengrösse, Alkohol (exakt) |
| 1093030 | [Comedus Grauer Burgunder Baden](https://kaisergarten-weine.ch/product/comedus-grauer-burgunder-baden/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt), Restzucker |
| 1093032 | [Comedus Spätburgunder Rot](https://kaisergarten-weine.ch/product/comedus-spaetburgunder-rot/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092969 | [Creme Melone Likör](https://kaisergarten-weine.ch/product/creme-melone-likoer/) | Dessertweine / Liköre | Lokal | Jahrgang, Rebsorte, Region, Flaschengrösse, Alkohol (exakt), Restzucker, Säure |
| 1093008 | [D`Artagnan Chardonnay  brut](https://kaisergarten-weine.ch/product/dartagnan-chardonnay-brut/) | Schaumweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093068 | [D`Artagnan Scheurebe sweet](https://kaisergarten-weine.ch/product/dartagnan-scheurebe-sweet/) | Schaumweine | Lokal | Region, Flaschengrösse, Alkohol (exakt), Restzucker |
| 1093086 | [DKNK Reserve Cab/Me. MAGNUM 2023](https://kaisergarten-weine.ch/product/dknk-reserve-cab-me-magnum-2023/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093084 | [DKNK Reserve Cabernet / Merlot 2023](https://kaisergarten-weine.ch/product/dknk-reserve-cabernet-merlot-2023/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093012 | [DKNK Reserve Chardonnay 2022](https://kaisergarten-weine.ch/product/dknk-reserve-chardonnay-2022/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt), Geschmack |
| 1092963 | [DKNK Reserve Grüner Veltliner 2023](https://kaisergarten-weine.ch/product/dknk-reserve-gruener-veltliner-2023/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093094 | [DKNK Reserve Grüner Veltliner 2023](https://kaisergarten-weine.ch/product/dknk-reserve-gruener-veltliner-2023-2/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093064 | [DKNK Reserve Le Jus 2022](https://kaisergarten-weine.ch/product/dknk-reserve-le-jus-2022/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093000 | [DKNK Reserve Riesling 2022](https://kaisergarten-weine.ch/product/dknk-reserve-riesling-2022/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093074 | [DKNK Reserve Rosé 2023](https://kaisergarten-weine.ch/product/dknk-reserve-rose-2023/) | Roséweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093050 | [DKNK Reserve Zweigelt 2022](https://kaisergarten-weine.ch/product/dknk-reserve-zweigelt-2022/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093010 | [Eiswein Grüner Veltliner](https://kaisergarten-weine.ch/product/eiswein-gruener-veltliner/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093040 | [Elias Malbec Reserva](https://kaisergarten-weine.ch/product/elias-malbec-reserva/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092975 | [Gin Armstrong Berries](https://kaisergarten-weine.ch/product/gin-armstrong-berries/) | Spirituosen | Lokal | Jahrgang, Rebsorte, Land, Region, Flaschengrösse, Alkohol (exakt), Geschmack, Restzucker, Säure |
| 1093038 | [Kaiser Amaranto Rouge](https://kaisergarten-weine.ch/product/kaiser-amaranto-rouge/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt), Geschmack |
| 1093046 | [Kaiser Carnuntum DAC](https://kaisergarten-weine.ch/product/kaiser-carnuntum-dac/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093044 | [Kaiser Gemischter Satz](https://kaisergarten-weine.ch/product/kaiser-gemischter-satz/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1092973 | [Kaiser Grappa Amarone Barrique](https://kaisergarten-weine.ch/product/kaiser-grappa-amarone-barrique/) | Spirituosen | Lokal | Jahrgang, Rebsorte, Region, Geschmack, Restzucker, Säure |
| 1093026 | [Kaiser Grüner Veltliner Prestige tr.](https://kaisergarten-weine.ch/product/kaiser-gruener-veltliner-prestige-tr/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093062 | [Kaiser Rose trocken](https://kaisergarten-weine.ch/product/kaiser-rose-trocken/) | Roséweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093058 | [Kaiser Weißer Burgunder](https://kaisergarten-weine.ch/product/kaiser-weisser-burgunder/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093028 | [Kaiser Zweigelt trocken](https://kaisergarten-weine.ch/product/kaiser-zweigelt-trocken/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093004 | [Kaiserbote Gelber Muskateller 2025](https://kaisergarten-weine.ch/product/kaiserbote-gelber-muskateller-2025/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092998 | [Kaiserbote Müller Thurgau](https://kaisergarten-weine.ch/product/kaiserbote-mueller-thurgau/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1092992 | [Kaiserbote Muskat Ottonel htr. Weinhaus](https://kaisergarten-weine.ch/product/kaiserbote-muskat-ottonel-htr-weinhaus/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093056 | [Kaisergarten Jubiläum Reserve – weiß](https://kaisergarten-weine.ch/product/kaisergarten-jubilaeum-reserve-weiss/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092994 | [Kaiserprinz Riesling](https://kaisergarten-weine.ch/product/kaiserprinz-riesling/) | Weissweine | Lokal | Jahrgang, Flaschengrösse, Alkohol (exakt) |
| 1092967 | [Marillenlikör](https://kaisergarten-weine.ch/product/marillenlikoer/) | Dessertweine / Liköre | Lokal | Jahrgang, Rebsorte, Region, Flaschengrösse, Alkohol (exakt), Restzucker, Säure |
| 1092979 | [Memoire Pauillac 6 Flaschen original Holzkiste](https://kaisergarten-weine.ch/product/memoire-pauillac-6-flaschen-original-holzkiste/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092977 | [Memoire Pauillac Einzel](https://kaisergarten-weine.ch/product/memoire-pauillac-einzel/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093016 | [Moon Whisperer Shiraz Barossa Valley](https://kaisergarten-weine.ch/product/moon-whisperer-shiraz-barossa-valley/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093076 | [Negroamaro](https://kaisergarten-weine.ch/product/negroamaro/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093060 | [Nier Blaufränkisch Reserve](https://kaisergarten-weine.ch/product/nier-blaufraenkisch-reserve/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092996 | [NIER Gewürztraminer Weinhaus Reserve 2022](https://kaisergarten-weine.ch/product/nier-gewuerztraminer-weinhaus-reserve-2022/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093042 | [NIER Grüner Veltliner DAC BIO](https://kaisergarten-weine.ch/product/nier-gruener-veltliner-dac-bio/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092982 | [NIER Heideboden Reserve](https://kaisergarten-weine.ch/product/nier-heideboden-reserve/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093048 | [NIER Limitee Reserve Rouge](https://kaisergarten-weine.ch/product/nier-limitee-reserve-rouge/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1092980 | [NIER Merlot Reserve](https://kaisergarten-weine.ch/product/nier-merlot-reserve/) | Rotweine | Lokal | Jahrgang, Region, Flaschengrösse, Alkohol (exakt) |
| 1093078 | [NIER Riesling tr.](https://kaisergarten-weine.ch/product/nier-riesling-tr/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093002 | [Nier Zweigelt Reserve halbtrocken](https://kaisergarten-weine.ch/product/nier-zweigelt-reserve-halbtrocken/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093105 | [oenm45](https://kaisergarten-weine.ch/product/oenm45/) | Weitere Artikel / ungeklärt | Fehlt – Platzhalter | Jahrgang, Rebsorte, Land, Region, Flaschengrösse, Alkohol (exakt), Geschmack, Restzucker, Säure, Beschreibung |
| 1093014 | [Petite Le Jus Reserve](https://kaisergarten-weine.ch/product/petite-le-jus-reserve/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt), Geschmack |
| 1093082 | [Pigalle Blanc Spätlese](https://kaisergarten-weine.ch/product/pigalle-blanc-spaetlese/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt), Restzucker |
| 1093024 | [Pigalle Grüner Veltliner lieblich](https://kaisergarten-weine.ch/product/pigalle-gruener-veltliner-lieblich/) | Weissweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1092984 | [Pigalle Herbstlese](https://kaisergarten-weine.ch/product/pigalle-herbstlese/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093022 | [Pigalle Merlot – Zweigelt](https://kaisergarten-weine.ch/product/pigalle-merlot-zweigelt/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093070 | [Pigalle Rouge Spätlese Süss](https://kaisergarten-weine.ch/product/pigalle-rouge-spaetlese-suess/) | Rotweine | Lokal | Region, Flaschengrösse |
| 1093020 | [Pigalle Welschriesling – Muskat](https://kaisergarten-weine.ch/product/pigalle-welschriesling-muskat/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1092965 | [Pineau V. De Romanet](https://kaisergarten-weine.ch/product/pineau-v-de-romanet/) | Dessertweine / Liköre | Lokal | Jahrgang, Region, Flaschengrösse, Alkohol (exakt), Restzucker, Säure |
| 1093006 | [Primitivo di Manduria Italien Adeodatus](https://kaisergarten-weine.ch/product/primitivo-di-manduria-italien-adeodatus/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093036 | [Prosecco Valdessa brut  il maestro](https://kaisergarten-weine.ch/product/prosecco-valdessa-brut-il-maestro/) | Schaumweine | Lokal | Jahrgang, Flaschengrösse, Alkohol (exakt) |
| 1092986 | [Ruby Port Naravo](https://kaisergarten-weine.ch/product/ruby-port-naravo/) | Dessertweine / Liköre | Lokal | Jahrgang, Rebsorte, Region, Flaschengrösse, Alkohol (exakt), Säure |
| 1092971 | [Rum Bailando XO Caribean](https://kaisergarten-weine.ch/product/rum-bailando-xo-caribean/) | Spirituosen | Lokal | Jahrgang, Rebsorte, Land, Region, Flaschengrösse, Alkohol (exakt), Geschmack, Restzucker, Säure |
| 1092990 | [Terre du Roc Rouge](https://kaisergarten-weine.ch/product/terre-du-roc-rouge/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1092988 | [Tribun Goldener Padrone](https://kaisergarten-weine.ch/product/tribun-goldener-padrone/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093090 | [Tribun Toscana](https://kaisergarten-weine.ch/product/tribun-toscana/) | Rotweine | Lokal | Flaschengrösse, Alkohol (exakt) |
| 1093066 | [Turul Reserve Sauvignon Blanc black label](https://kaisergarten-weine.ch/product/turul-reserve-sauvignon-blanc-black-label/) | Weissweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093092 | [Xhosa Black Series Shiraz/Merlot NEU](https://kaisergarten-weine.ch/product/xhosa-black-series-shiraz-merlot-neu/) | Rotweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |
| 1093052 | [Xhosa Pinot Noir / Chardonnay](https://kaisergarten-weine.ch/product/xhosa-pinot-noir-chardonnay/) | Roséweine | Lokal | Region, Flaschengrösse, Alkohol (exakt) |

## Prüfungen und Grenzen

Am 06.11.2026 erneut ausgeführt:

- `npm test`: erfolgreich. Phase 1, Messekontext, Phase 2 und Katalogtests.
- `npm run build`: erfolgreich; enthält TypeScript-Prüfung (`tsc`) und Vite-Produktionsbuild.
- Katalogtests: 67 eindeutige IDs/Links, Seitenzählung, Kategorien, 66 lokale PNGs, fehlendes Bild, Suche, Sortierung mit leeren Werten, Preissperren, Gebindesperren und Bereinigung alter Warenkörbe. Leere/deaktivierte Demo-Preiskonfiguration zusätzlich abgesichert.
- Phase-2-Tests prüfen echte Geschäftslogikmodule mit Testdaten: 6er-/12er-Regel, Mischkartons, Rappenrechnung, historische Snapshots, wiederholter Abschluss, Konflikte und Speicherfehler. Testpreise sind isolierte Test-Fixtures und keine eingetragenen Katalog- oder Demo-Verkaufspreise.
- Browserprüfung **nicht abgeschlossen**: Im vorherigen Versuch war localhost im integrierten Browser nicht erreichbar; anschliessend beendete Computer Use die native Prüfung, weil die aktuelle Browser-URL unter Windows nicht zuverlässig festgestellt werden konnte. Auf ausdrücklichen Wunsch keine weiteren Browserversuche. Kein erfolgreicher visueller End-to-End-Test behauptet.

Offen bleiben eine manuelle Sichtprüfung auf Tablet/Desktop, Betreiberklärung der Datenkonflikte sowie freigegebene Preise und Gebinde für eine spätere Bestelldemo. Aus bestandenen Modultests folgt keine abgeschlossene Browserprüfung.

## Betroffene Dateien und Abgrenzung

Katalogintegration: `.gitignore` (lokaler Recherchecache ausgeschlossen), `scripts/import_catalog.py`, `scripts/prepare_catalog.py`, `scripts/catalog_editorial.json`, `src/data/products.json`, `src/data/catalog.ts`, `src/data/mockWines.ts`, `public/images/products/` (66 PNGs), `src/types/wine.ts`, `src/types/cart.ts`, `src/types/order.ts`, `src/utils/catalog.ts`, `src/utils/cartonRule.ts`, `src/utils/orderProcessing.ts`, `src/context/CartContext.tsx`, `src/App.tsx`, `src/components/CategoryFilter.tsx`, `src/components/HeroBanner.tsx`, `src/components/ProductImage.tsx`, `src/components/WineCard.tsx`, `src/components/WineDetailModal.tsx`, `src/components/CheckoutModal.tsx`, `test/verify_catalog.mjs`, `package.json`.

Dieser Abschlussschritt ergänzt ausschliesslich `src/config/demoPrices.ts`, die Konfigurationsprüfungen in `test/verify_catalog.mjs` und diese Dokumentation. Der Build erzeugt lokal `dist/` neu. Bereits vor der Katalogarbeit vorhandene Änderungen im Arbeitsverzeichnis sind nicht Teil dieser Aufzählung.

Keine Änderungen an Claudes Phase-3-Dateien, Admin-/Provisionsfunktionen oder GitHub-Pages-Konfiguration. Kein Commit, Push oder Deployment im Abschlussschritt. Die bereits veröffentlichte Demo bleibt unverändert.


## Freigegebenes Katalog-Release – 06.11.2026

Der Auftraggeber hat die Veröffentlichung der Katalogaktualisierung ausdrücklich freigegeben. Vorherige Hinweise auf „kein Deployment“ dokumentieren den abgeschlossenen lokalen Integrationsschritt.

Release-Prüfungen erneut erfolgreich: `npm test` (alle vier Suiten), `npm run build` einschliesslich `tsc`. Alle 67 IDs, Namen, Original-URLs, Rohattribute und Bildquellen stimmen mit der lokalen offiziellen Recherche überein. Alle 66 Bilddateien sind bytegleich im Produktionsbuild enthalten. Logo, Farbdefinitionen, Expovina-Konfiguration und Pages-Workflow sind gegenüber der veröffentlichten Version unverändert. Ein dauerhafter Header-Hinweis „DEMO – keine echten Bestellungen“ wurde ergänzt.

Lokale Browserprüfung erneut versucht: Der integrierte Browser meldet für die Vorschau `ERR_CONNECTION_TIMED_OUT`. Keine weiteren nativen Browserversuche und keine Umgehung von Sicherheitsbeschränkungen. Die visuelle Tablet-/End-to-End-Prüfung ist damit weiterhin offen; Modultests und Asset-Prüfungen ersetzen sie nicht.

Veröffentlicht wird ausschliesslich die kuratierte Anwendung mit Tests, Build-Konfiguration, Produktbildern und dieser Dokumentation aus dem separaten bereinigten Git-Repository. Recherchecache, Importhilfen, private Übergaben, Claude-Phase-3-Dateien und die alte Projekt-Git-Historie gehören nicht zum Release. Die synthetischen Kunden verwenden ausschliesslich `example.invalid`; ein Formularplatzhalter ist kein Kundendatensatz. Im ausgewählten Quellstand wurden keine Geheimnistreffer gefunden.

Rollback-Basis: `26fd600e23873b05f3e9d8adbbf7c50d528551a6` (bisherige erfolgreiche Live-Version). Das lokale, mit `git bundle verify` geprüfte Bundle liegt ausserhalb des Veröffentlichungs-Repositories unter `.publication/rollback-before-catalog.bundle`. Für einen Rollback einen Revert des Katalog-Commits auf `main` veröffentlichen und denselben manuellen Pages-Workflow ausführen. Kein Force-Push erforderlich.
