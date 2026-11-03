# SAMIN SOCIAL HUB

Ein responsives Dashboard für Kundenübersicht, Content-Entwürfe und Redaktionsplanung im Samin-Stil (Beige, Schwarz und Gold).

> **MVP-Hinweis:** Die gezeigten Kundinnen, Beiträge, Zahlen und Termine sind Beispieldaten. Das Dashboard ist noch nicht mit Instagram verbunden. Es kann keine Inhalte veröffentlichen oder echte Veröffentlichungen planen.

## Lokal starten

Voraussetzung: Node.js 20.9 oder neuer sowie npm.

1. Repository herunterladen oder klonen.
2. Im Projektordner `npm.cmd install` ausführen.
3. Mit `npm.cmd run dev` den Entwicklungsserver starten.
4. `http://localhost:3000` im Browser öffnen.

Für eine Produktionsvorschau `npm.cmd run build` und anschließend `npm.cmd run start` ausführen.

## Zentrale Anmeldung, Datenbank und Medienablage einrichten

Die App nutzt Supabase Auth, Postgres und privaten Supabase Storage. Solange keine Supabase-Werte in `.env.local` stehen, bleibt die lokale Demo aktiv.

1. Ein Supabase-Projekt anlegen und im Projekt-Dashboard die Projekt-URL sowie den **Publishable Key** kopieren.
2. Die Datei `.env.example` als `.env.local` kopieren und beide Werte dort eintragen. Niemals einen `service_role`-Key eintragen oder veröffentlichen.
3. Im Supabase SQL Editor den Inhalt von `supabase/migrations/202611030001_initial_workspace.sql` ausführen. Er legt private Workspaces, Kunden, Beitrags-/Mediendaten, Zugriffsschutz und den privaten Speicher-Bucket an.
4. In Supabase unter **Authentication → URL Configuration** `http://localhost:3000/auth/callback` als Redirect URL ergänzen.
5. Im Projektordner `npm.cmd install` und danach `npm.cmd run dev` ausführen. Nach Änderungen an `.env.local` den Entwicklungsserver neu starten.
6. `http://localhost:3000/login` öffnen, ein Konto erstellen und die Bestätigungs-E-Mail anklicken. Bei der Registrierung entsteht automatisch ein privater Workspace.

Beiträge, Grafiken und Kunden werden nach der Anmeldung zentral gespeichert. Datenbankregeln begrenzen Zugriffe auf Mitglieder des jeweiligen Workspaces; Mediendateien liegen in einem privaten Bucket und werden über kurzlebige Links angezeigt. Die bisherige IndexedDB-Demoablage wird nicht automatisch in Supabase übertragen.

Supabase ist noch nicht mit einem konkreten Projekt verbunden, solange keine Projektwerte in `.env.local` vorhanden sind. Anmeldung, Workspace und zentrale Speicherung müssen nach der Einrichtung mit einem echten Testkonto überprüft werden. Dafür niemals Projekt-Schlüssel hier im Chat teilen.

## Was im MVP funktioniert

- Dashboard mit Kennzahlen und Statusanzeigen (alles Demo).
- Beispiel-Kundenliste im Seitenmenü.
- Redaktionsübersicht mit Filtern für Entwürfe und ausstehende Freigaben.
- „Neuer Beitrag“ öffnet das Medien-Studio.
- Medien-Studio für Bildgrafiken: Bild hochladen, Quadrat-/Hochformat-/Story-Format wählen, Text und Farben anpassen, Caption und Hashtags ergänzen sowie als PNG exportieren.
- „Als Beitragsentwurf speichern“ verknüpft Grafik, Caption und Hashtags mit einem Kunden und zeigt den Entwurf samt Vorschaubild in der Redaktionsübersicht.
- Eigene Beitragsentwürfe lassen sich in der Redaktionsübersicht erneut öffnen und bearbeiten. Ohne Supabase bleiben Änderungen lokal; mit Supabase werden sie zentral gespeichert.
- Responsive Layout für Desktop, Tablet und Mobilgeräte.

Ohne Supabase-Konfiguration speichert das Medien-Studio Grafiken und Beitragsentwürfe lokal im IndexedDB-Speicher dieses Browserprofils. Sie werden nicht zwischen Geräten oder Teammitgliedern synchronisiert. Mit Supabase-Konfiguration werden neue Entwürfe zentral in Postgres und Medien in einem privaten Bucket gespeichert. Ein angegebenes Veröffentlichungsdatum ist nur ein Wunsch und löst keine automatische Planung aus. Video-/Reel-Bearbeitung, Einladungen für Teammitglieder und Kundenfreigaben sind noch nicht umgesetzt.

## Roadmap: offizielle Meta-/Instagram-Anbindung

1. **Teamzugriff und Freigaben:** Einladungen, Rollen im Workspace und Kundenfreigaben ergänzen.
2. **Medienproduktion:** Video-/Reel-Bearbeitung, Untertitel und ein zentraler Videoablauf ergänzen.
3. **Meta-App einrichten:** Meta-Entwicklerkonto, App, passende Instagram-Professional-Konten und Facebook-Seiten gemäß den dann geltenden Meta-Voraussetzungen.
4. **Autorisierung:** Server-seitiger OAuth-Flow, erforderliche Berechtigungen und geprüfte Token-Verwaltung. Zugangstoken gehören ausschließlich in verschlüsselte Server-Speicherung; niemals in den Browser, Quellcode oder Git.
5. **Inhalte und Veröffentlichung:** Serverseitige Anbindung an die offizielle Instagram Graph API, Medienprüfung, Erstellung/Veröffentlichung, Statusabgleich sowie verständliche Fehlerbehandlung.
6. **Planung und Betrieb:** Zuverlässige Server-Warteschlange mit Zeitzonen, Wiederholungen, Deduplizierung, Protokollierung, Benachrichtigungen und Tests mit autorisierten Konten.

Meta-Anforderungen und Berechtigungen können sich ändern. Vor der Umsetzung müssen die dann geltenden offiziellen Meta-Dokumente geprüft werden. Bis OAuth, sichere Tokens, Graph-API-Aufrufe, Berechtigungen und Scheduler eingerichtet und erfolgreich getestet sind, ist Instagram weder verbunden noch Veröffentlichung oder automatische Planung verfügbar.

## Technik

- Next.js App Router und TypeScript
- React
- Eigenes CSS, ohne Komponentenbibliothek
- Für Supabase sind eine Projekt-URL und ein Publishable Key erforderlich; ein Service-Role-Key wird nicht in der App verwendet.
