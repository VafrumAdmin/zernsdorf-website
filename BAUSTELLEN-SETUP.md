# Baustellen-System Setup

## Status: Bereit zum Deployen

### Erstellte Dateien:

1. **Datenbank-Migration**
   - `supabase/migrations/007_constructions.sql`
   - Erstellt: `constructions` Tabelle + `construction_sources` Tabelle

2. **API-Endpunkte**
   - `src/app/api/constructions/route.ts` - GET/POST für alle Baustellen
   - `src/app/api/constructions/[id]/route.ts` - GET/PATCH/DELETE einzelne Baustelle
   - `src/app/api/constructions/fetch/route.ts` - Für n8n automatische Abfrage

3. **Lib-Funktionen**
   - `src/lib/traffic/constructions.ts` - DB-Abfragen für aktive/geplante Baustellen

4. **Admin-Interface**
   - `src/app/[locale]/admin/constructions/page.tsx` - Vollständige Admin-Oberfläche

5. **Komponenten-Update**
   - `src/components/traffic/ConstructionCard.tsx` - Quelle jetzt als klickbarer Link

---

## Konfigurierte Quellen für tägliche Überwachung

| Quelle | Kategorie | Intervall | URL |
|--------|-----------|-----------|-----|
| **SessionNet KW Ratsinformation** | Zernsdorf | 24h | https://sessionnet.owl-it.de/koenigs_wusterhausen/ |
| **Stadt Königs Wusterhausen** | KW | 12h | https://www.koenigs-wusterhausen.de/aktuelles |
| **LDS Verkehrseinschränkungen** | LDS | 24h | https://www.dahme-spreewald.de/de/aktuelles/verkehrsraumeinschraenkungen-im-landkreis-dahme-spreewald/ |
| **Landkreis Dahme-Spreewald** | LDS | 12h | https://www.dahme-spreewald.de/de/aktuelles/strassensperrungen-im-landkreis-dahme-spreewald/ |
| **Baustelleninfo Brandenburg** | Brandenburg | 12h | https://www.ls.brandenburg.de/ls/de/bauen/baustelleninformationssystem/ |
| **ADAC A10** | A10 | 12h | https://www.adac.de/verkehr/verkehrsinformationen/de/a10/ |
| **ADAC A12** | A12 | 12h | https://www.adac.de/verkehr/verkehrsinformationen/de/a12/ |
| **ADAC A13** | A13 | 12h | https://www.adac.de/verkehr/verkehrsinformationen/de/a13/ |
| **i2030 Bahnprojekte** | Bahn | 12h | https://www.i2030.de/suedost/ |

---

## n8n Workflow für automatisches Monitoring

### Workflow 1: Baustellen-Daten empfangen

**API-Endpunkt:**
```
POST https://zernsdorf.info/api/constructions/fetch
Authorization: Bearer zernsdorf-constructions-2026
Content-Type: application/json
```

**Request Body:**
```json
{
  "source": "SessionNet-KW",
  "constructions": [
    {
      "title": "Sperrung Musterstraße",
      "location": "Musterstraße, Zernsdorf",
      "start_date": "2026-02-01",
      "end_date": "2026-03-15",
      "description": "Kanalbauarbeiten",
      "type": "road",
      "status": "active",
      "impact_level": "medium",
      "traffic_impact": "Halbseitige Sperrung",
      "external_id": "sessionnet-12345"
    }
  ]
}
```

### Workflow 2: Quellen automatisch prüfen (mit AI)

Für intelligente Überwachung der Quellen kann n8n mit einem AI-Node (OpenAI/Claude) kombiniert werden:

1. **Schedule Trigger** - Täglich um 6:00 und 18:00 Uhr
2. **HTTP Request** - Seite abrufen
3. **AI Node** - Inhalt analysieren: "Extrahiere alle Straßensperrungen und Baustellen die Zernsdorf, Neue Mühle, KW betreffen"
4. **HTTP Request** - Ergebnisse an API senden

---

## Aktuelle Baustellen in der Datenbank

### Aktive Baustellen (7):
- A10 Großbaustelle Werder - Groß Kreutz (bis 2027)
- A10 Mühlenfließbrücke Rüdersdorf (bis 2028)
- Bahnhof KW Nordkopf-Umbau i2030 (bis 2027)
- A12 Ausbau Briesen - Fürstenwalde-Ost (bis Feb 2026)
- A12 Gesamtausbau 6-spurig (bis 2028)
- A13 Straßenschäden Calau - Kittlitz
- Abriss Garagenkomplex Heinrich-Heine-Straße (bis April 2026)

### Geplante Baustellen (3):
- **Sperrung Tiergartenstraße (L30)** - Verbindung nach KW über Neue Mühle (ab 2026, KRITISCH!)
- A10 Anschlussstelle Freienbrink-Nord (Tesla) - ab Juni 2026
- Bahn-Sperrpause September/Oktober 2026

### Abgeschlossene Baustellen (2):
- Knotenpunkt Karl-Marx-Straße / Segelfliegerdamm (Mai 2025)
- Bahn-Sperrpause September 2025

---

## Deployment

```bash
git add .
git commit -m "feat: Baustellen-System mit Auto-Monitoring"
git push origin main
```

Danach in n8n den Workflow einrichten für tägliche Überwachung.
