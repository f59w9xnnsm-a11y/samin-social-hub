# SAMIN SOCIAL HUB

Ein responsives Dashboard für Kundenübersicht, Content-Entwürfe und Redaktionsplanung im Samin-Stil (Beige, Schwarz und Gold).

> **MVP-Hinweis:** Die gezeigten Kundinnen, Beiträge, Zahlen und Termine sind Beispieldaten. Das Dashboard ist noch nicht mit Instagram verbunden. Es kann keine Inhalte veröffentlichen oder echte Veröffentlichungen planen.

## Lokal starten

Voraussetzung: Node.js 20.9 oder neuer sowie npm.

1. Repository herunterladen oder klonen.
2. Im Projektordner `npm install` ausführen.
3. Mit `npm run dev` den Entwicklungsserver starten.
4. `http://localhost:3000` im Browser öffnen.

Für eine Produktionsvorschau `npm run build` und anschließend `npm run start` ausführen.

## Was im MVP funktioniert

- Dashboard mit Kennzahlen und Statusanzeigen (alles Demo).
- Beispiel-Kundenliste im Seitenmenü.
- Redaktionsübersicht mit Filtern für Entwürfe und ausstehende Freigaben.
- „Neuer Beitrag“ legt einen lokalen Demo-Entwurf an; er wird nicht gespeichert, wenn die Seite neu geladen wird.
- Medien-Studio für Bildgrafiken: Bild hochladen, Quadrat-/Hochformat-/Story-Format wählen, Text und Farben anpassen, Caption und Hashtags ergänzen sowie als PNG exportieren.
- „Als Beitragsentwurf speichern“ verknüpft Grafik, Caption und Hashtags lokal mit einem Demo-Kunden und zeigt den Entwurf samt Vorschaubild in der Redaktionsübersicht.
- Eigene Beitragsentwürfe lassen sich in der Redaktionsübersicht erneut öffnen und bearbeiten; Änderungen an Kunde, Caption, Hashtags und Veröffentlichungswunsch werden lokal gespeichert.
- Responsive Layout für Desktop, Tablet und Mobilgeräte.

Das Medien-Studio speichert Grafiken und Beitragsentwürfe lokal im IndexedDB-Speicher dieses Browserprofils. Sie werden nicht zwischen Geräten oder Teammitgliedern synchronisiert. Ein angegebenes Veröffentlichungsdatum ist nur ein Wunsch und löst keine automatische Planung aus. Video-/Reel-Bearbeitung ist noch nicht umgesetzt. Es gibt noch keine zentrale Datenbank, Anmeldung, Teamrollen oder Kundenfreigaben.

## Roadmap: offizielle Meta-/Instagram-Anbindung

1. **Produkt- und Kontenmodell:** Datenbank, Anmeldung, Rollen, Mandantentrennung sowie sichere Zuordnung von Kunden und Konten.
2. **Meta-App einrichten:** Meta-Entwicklerkonto, App, passende Instagram-Professional-Konten und Facebook-Seiten gemäß den aktuellen Meta-Voraussetzungen.
3. **Autorisierung:** Serverseitiger OAuth-Flow, erforderliche Berechtigungen und geprüfte Token-Verwaltung. Zugangstoken gehören ausschließlich in verschlüsselte Server-Speicherung; niemals in den Browser, Quellcode oder Git.
4. **Inhalte und Veröffentlichung:** Serverseitige Anbindung an die offizielle Instagram Graph API, Medienprüfung, Erstellung/Veröffentlichung, Statusabgleich sowie verständliche Fehlerbehandlung. Nur von Meta unterstützte Inhaltstypen und Konten können berücksichtigt werden.
5. **Planung:** Serverseitige, zuverlässige Warteschlange mit Zeitzonen, Wiederholungen, Deduplizierung, Protokollierung und Benachrichtigungen. Ein Zeitfeld im Dashboard allein ist keine automatische Planung.
6. **Freigabe und Betrieb:** Kundenfreigaben, sichere Trennung pro Kunde, Datenschutz-/Löschkonzept, Meta-App-Prüfung und Ende-zu-Ende-Tests mit autorisierten Testkonten vor dem Produktivbetrieb.

Meta-Anforderungen und Berechtigungen können sich ändern. Vor der Umsetzung müssen die dann geltenden offiziellen Meta-Dokumente geprüft werden. Bis OAuth, sichere Tokens, Graph-API-Aufrufe, Berechtigungen und Scheduler eingerichtet und erfolgreich getestet sind, ist Instagram weder verbunden noch Veröffentlichung oder automatische Planung verfügbar.

## Technik

- Next.js App Router und TypeScript
- React
- Eigenes CSS, ohne Komponentenbibliothek
- Keine API-Schlüssel oder Zugangsdaten erforderlich
