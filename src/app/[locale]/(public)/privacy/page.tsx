import { Metadata } from 'next';
import { CookieSettingsButton } from '@/components/cookie';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von ZernsdorfConnect',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Datenschutzerklärung
          </h1>

          <div className="prose prose-slate max-w-none">
            {/* Einleitung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Datenschutz auf einen Blick
              </h2>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Allgemeine Hinweise</h3>
              <p className="text-slate-600 mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
                Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert
                werden können.
              </p>
            </section>

            {/* Verantwortlicher */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Verantwortliche Stelle
              </h2>
              <p className="text-slate-600 mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-slate-700">
                  ZernsdorfConnect<br />
                  Gemeinde Zernsdorf<br />
                  15712 Königs Wusterhausen<br />
                  <br />
                  E-Mail: info@zernsdorf.de<br />
                  Telefon: 03375 / 123456
                </p>
              </div>
              <p className="text-slate-600">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein
                oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
                personenbezogenen Daten entscheidet.
              </p>
            </section>

            {/* Datenerfassung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. Datenerfassung auf dieser Website
              </h2>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Server-Log-Dateien</h3>
              <p className="text-slate-600 mb-4">
                Der Provider dieser Website erhebt und speichert automatisch Informationen in
                sogenannten Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
                Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Lokale Speicherung (Local Storage)</h3>
              <p className="text-slate-600 mb-4">
                Diese Website verwendet die lokale Speicherung Ihres Browsers (Local Storage),
                um Ihre Einstellungen zu speichern. Dies umfasst:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Ihre Cookie-Einstellungen</li>
                <li>Ihre Adresse für den Müllkalender (falls eingerichtet)</li>
                <li>Spracheinstellungen</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Diese Daten werden ausschließlich lokal auf Ihrem Gerät gespeichert und nicht
                an unsere Server übertragen. Sie können diese Daten jederzeit in Ihren
                Browser-Einstellungen löschen.
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Cookies
              </h2>
              <p className="text-slate-600 mb-4">
                Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf
                Ihrem Endgerät gespeichert werden und die Ihr Browser speichert.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Arten von Cookies</h3>

              <div className="space-y-4 mb-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="font-medium text-emerald-900 mb-1">Notwendige Cookies</h4>
                  <p className="text-emerald-800 text-sm">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                    Sie speichern z.B. Ihre Cookie-Einstellungen und ermöglichen die Navigation.
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-1">Funktionale Cookies</h4>
                  <p className="text-blue-800 text-sm">
                    Diese Cookies ermöglichen erweiterte Funktionen wie persönliche Einstellungen.
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-1">Analyse Cookies</h4>
                  <p className="text-purple-800 text-sm">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                    Alle Daten werden anonymisiert erfasst.
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-1">Marketing Cookies</h4>
                  <p className="text-orange-800 text-sm">
                    Diese Cookies werden für personalisierte Werbung verwendet.
                    Derzeit verwenden wir keine Marketing-Cookies.
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-slate-700 text-sm mb-2">
                  <strong>Cookie-Einstellungen ändern:</strong> Sie können Ihre Cookie-Einstellungen
                  jederzeit anpassen.
                </p>
                <CookieSettingsButton />
              </div>
            </section>

            {/* Externe Dienste */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Externe Dienste und APIs
              </h2>

              <h3 className="text-lg font-medium text-slate-800 mb-2">SBAZV (Müllabfuhrtermine)</h3>
              <p className="text-slate-600 mb-4">
                Für die Anzeige von Müllabfuhrterminen greifen wir auf Daten des
                Südbrandenburgischen Abfallzweckverbandes (SBAZV) zu. Dabei wird Ihre
                eingegebene Adresse an den SBAZV übermittelt, um die korrekten Abholtermine
                zu ermitteln.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Wetter- und Verkehrsdaten</h3>
              <p className="text-slate-600 mb-4">
                Für aktuelle Wetter- und Verkehrsinformationen nutzen wir öffentlich
                verfügbare Schnittstellen. Dabei werden keine personenbezogenen Daten übertragen.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Kartendienste</h3>
              <p className="text-slate-600 mb-4">
                Für die Kartenanzeige verwenden wir OpenStreetMap-basierte Dienste.
                Bei der Nutzung der Karte wird Ihre IP-Adresse an die Kartenserver übermittelt.
              </p>
            </section>

            {/* Rechte */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                6. Ihre Rechte
              </h2>
              <p className="text-slate-600 mb-4">
                Sie haben jederzeit das Recht:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>
                  <strong>Auskunft</strong> über Ihre bei uns gespeicherten personenbezogenen
                  Daten zu erhalten (Art. 15 DSGVO)
                </li>
                <li>
                  <strong>Berichtigung</strong> unrichtiger personenbezogener Daten zu verlangen
                  (Art. 16 DSGVO)
                </li>
                <li>
                  <strong>Löschung</strong> Ihrer bei uns gespeicherten personenbezogenen Daten
                  zu verlangen (Art. 17 DSGVO)
                </li>
                <li>
                  <strong>Einschränkung</strong> der Verarbeitung Ihrer personenbezogenen Daten
                  zu verlangen (Art. 18 DSGVO)
                </li>
                <li>
                  <strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art. 21 DSGVO)
                </li>
                <li>
                  <strong>Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)
                </li>
                <li>
                  Ihre <strong>Einwilligung zu widerrufen</strong>, sofern Sie eine solche
                  erteilt haben (Art. 7 Abs. 3 DSGVO)
                </li>
                <li>
                  Sich bei einer <strong>Aufsichtsbehörde zu beschweren</strong> (Art. 77 DSGVO)
                </li>
              </ul>
            </section>

            {/* SSL */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                7. SSL-Verschlüsselung
              </h2>
              <p className="text-slate-600 mb-4">
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                vertraulicher Inhalte eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung
                erkennen Sie daran, dass die Adresszeile des Browsers von "http://" auf "https://"
                wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
              </p>
            </section>

            {/* Aktualität */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                8. Aktualität und Änderung dieser Datenschutzerklärung
              </h2>
              <p className="text-slate-600 mb-4">
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Januar 2026.
              </p>
              <p className="text-slate-600">
                Durch die Weiterentwicklung unserer Website oder aufgrund geänderter
                gesetzlicher beziehungsweise behördlicher Vorgaben kann es notwendig werden,
                diese Datenschutzerklärung zu ändern. Die jeweils aktuelle Datenschutzerklärung
                kann jederzeit auf dieser Website abgerufen werden.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
