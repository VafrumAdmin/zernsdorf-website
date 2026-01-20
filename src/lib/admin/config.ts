// Admin-Konfiguration
// WICHTIG: Ändern Sie das Passwort vor dem Produktiveinsatz!

// Das Admin-Passwort kann über die Umgebungsvariable ADMIN_PASSWORD gesetzt werden
// oder hier direkt (nur für Entwicklung)
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zernsdorf-admin-2024';

// Session-Dauer in Millisekunden (24 Stunden)
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Cookie-Name für Admin-Session
export const ADMIN_SESSION_COOKIE = 'admin-session';

// LocalStorage-Key für Wartungsmodus (Client-seitig)
export const MAINTENANCE_MODE_KEY = 'maintenance-mode';
