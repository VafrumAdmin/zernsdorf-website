-- Migration 006: Neue Menüpunkte hinzufügen
-- Fügt Mobilität und Lernen zum Menü hinzu

-- Mobilität (aktiv)
INSERT INTO menu_items (key, name, name_en, icon, path, sort_order, is_active, is_public)
VALUES ('mobility', 'Mobilität', 'Mobility', 'car', '/mobility', 5, true, true)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    path = EXCLUDED.path,
    sort_order = EXCLUDED.sort_order;

-- Lernen (standardmäßig deaktiviert - kann im Admin aktiviert werden)
INSERT INTO menu_items (key, name, name_en, icon, path, sort_order, is_active, is_public)
VALUES ('learning', 'Lernen', 'Learning', 'book-open', '/lernen', 115, false, true)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    path = EXCLUDED.path,
    sort_order = EXCLUDED.sort_order;
