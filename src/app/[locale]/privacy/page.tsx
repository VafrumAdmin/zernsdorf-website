import { Metadata } from 'next';
import { CookieSettingsButton } from '@/components/cookie';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von Zernsdorf.info',
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
                werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen
                Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Datenerfassung auf dieser Website</h3>
              <p className="text-slate-600 mb-4">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber.
                Dessen Kontaktdaten können Sie dem Abschnitt „Verantwortliche Stelle" in dieser
                Datenschutzerklärung entnehmen.
              </p>
              <p className="text-slate-600 mb-4">
                <strong>Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen.
                Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben
                oder bei der Registrierung angeben.
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website
                durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser,
                Betriebssystem oder Uhrzeit des Seitenaufrufs).
              </p>
              <p className="text-slate-600 mb-4">
                <strong>Wofür nutzen wir Ihre Daten?</strong><br />
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website
                zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
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
                  Jonas Hauke<br />
                  Karl-Marx-Str. 77<br />
                  15712 Königs Wusterhausen<br />
                  Deutschland<br />
                  <br />
                  Telefon: 01628172496<br />
                  E-Mail: info@zernsdorf.info
                </p>
              </div>
              <p className="text-slate-600">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein
                oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
                personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o.Ä.) entscheidet.
              </p>
            </section>

            {/* Speicherdauer */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. Speicherdauer
              </h2>
              <p className="text-slate-600 mb-4">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer
                genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck
                für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen
                geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen,
                werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen
                Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z.B. steuer-
                oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt
                die Löschung nach Fortfall dieser Gründe.
              </p>
            </section>

            {/* Rechtsgrundlagen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung
              </h2>
              <p className="text-slate-600 mb-4">
                Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre
                personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw.
                Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1
                DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die
                Übertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung
                außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO.
              </p>
              <p className="text-slate-600 mb-4">
                Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen
                in Ihr Endgerät (z.B. via Device-Fingerprinting) eingewilligt haben, erfolgt
                die Datenverarbeitung zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG. Die
                Einwilligung ist jederzeit widerrufbar.
              </p>
              <p className="text-slate-600 mb-4">
                Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher
                Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des
                Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern
                diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind auf
                Grundlage von Art. 6 Abs. 1 lit. c DSGVO.
              </p>
              <p className="text-slate-600 mb-4">
                Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses
                nach Art. 6 Abs. 1 lit. f DSGVO erfolgen.
              </p>
            </section>

            {/* Ihre Rechte */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Ihre Rechte
              </h2>
              <p className="text-slate-600 mb-4">
                Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden
                personenbezogenen Daten:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>
                  <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das Recht, eine Bestätigung
                  darüber zu verlangen, ob Sie betreffende personenbezogene Daten verarbeitet werden.
                </li>
                <li>
                  <strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie haben das Recht, die
                  Berichtigung Sie betreffender unrichtiger personenbezogener Daten zu verlangen.
                </li>
                <li>
                  <strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie haben das Recht, die
                  Löschung Ihrer personenbezogenen Daten zu verlangen.
                </li>
                <li>
                  <strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie haben
                  das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
                </li>
                <li>
                  <strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie haben das Recht,
                  Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
                </li>
                <li>
                  <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie haben das Recht, aus Gründen,
                  die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung
                  Widerspruch einzulegen.
                </li>
                <li>
                  <strong>Recht auf Widerruf (Art. 7 Abs. 3 DSGVO):</strong> Sie haben das Recht,
                  eine erteilte Einwilligung jederzeit zu widerrufen.
                </li>
                <li>
                  <strong>Beschwerderecht (Art. 77 DSGVO):</strong> Sie haben das Recht, sich bei
                  einer Aufsichtsbehörde zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:<br />
                  Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg<br />
                  Stahnsdorfer Damm 77, 14532 Kleinmachnow
                </li>
              </ul>
            </section>

            {/* Datenerfassung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                6. Datenerfassung auf dieser Website
              </h2>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Server-Log-Dateien</h3>
              <p className="text-slate-600 mb-4">
                Der Provider dieser Website erhebt und speichert automatisch Informationen in
                sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
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
                Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien
                Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Dateien
                erfasst werden.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Registrierung auf dieser Website</h3>
              <p className="text-slate-600 mb-4">
                Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen
                auf der Seite zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum
                Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich
                registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen
                vollständig angegeben werden. Anderenfalls werden wir die Registrierung ablehnen.
              </p>
              <p className="text-slate-600 mb-4">
                Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen
                Änderungen nutzen wir die bei der Registrierung angegebene E-Mail-Adresse, um
                Sie auf diesem Wege zu informieren.
              </p>
              <p className="text-slate-600 mb-4">
                Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt zum
                Zwecke der Durchführung des durch die Registrierung begründeten Nutzungsverhältnisses
                und ggf. zur Anbahnung weiterer Verträge (Art. 6 Abs. 1 lit. b DSGVO).
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Lokale Speicherung (Local Storage)</h3>
              <p className="text-slate-600 mb-4">
                Diese Website verwendet die lokale Speicherung Ihres Browsers (Local Storage),
                um Ihre Einstellungen zu speichern. Dies umfasst:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Ihre Cookie-Einstellungen</li>
                <li>Ihre Adresse für den Müllkalender (falls eingerichtet)</li>
                <li>Ihre nächste Bushaltestelle (falls eingerichtet)</li>
                <li>Spracheinstellungen</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Diese Daten werden ausschließlich lokal auf Ihrem Gerät gespeichert und nicht
                an unsere Server übertragen, sofern Sie nicht eingeloggt sind. Sie können diese
                Daten jederzeit in Ihren Browser-Einstellungen löschen.
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                7. Cookies
              </h2>
              <p className="text-slate-600 mb-4">
                Unsere Website verwendet sog. „Cookies". Cookies sind kleine Datenpakete und
                richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend
                für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies)
                auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs
                automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert,
                bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren
                Webbrowser erfolgt.
              </p>
              <p className="text-slate-600 mb-4">
                Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen stammen
                (sog. Third-Party-Cookies). Third-Party-Cookies ermöglichen die Einbindung
                bestimmter Dienstleistungen von Drittunternehmen innerhalb von Webseiten.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Arten von Cookies</h3>

              <div className="space-y-4 mb-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h4 className="font-medium text-emerald-900 mb-1">Technisch notwendige Cookies</h4>
                  <p className="text-emerald-800 text-sm">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                    Sie speichern z.B. Ihre Cookie-Einstellungen und ermöglichen die Navigation
                    sowie die Anmeldung. Ohne diese Cookies kann die Website nicht ordnungsgemäß
                    funktionieren. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
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
                8. Externe Dienste und APIs
              </h2>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Hosting</h3>
              <p className="text-slate-600 mb-4">
                Wir hosten die Inhalte unserer Website bei Hostinger. Anbieter ist die
                Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Zypern.
                Details entnehmen Sie der Datenschutzerklärung von Hostinger:
                https://www.hostinger.de/datenschutzrichtlinien
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Supabase (Datenbank)</h3>
              <p className="text-slate-600 mb-4">
                Für die Speicherung von Nutzerdaten und Inhalten verwenden wir Supabase.
                Anbieter ist Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992.
                Die Daten werden auf Servern in der EU gespeichert.
                Weitere Informationen: https://supabase.com/privacy
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">VBB (Fahrplandaten)</h3>
              <p className="text-slate-600 mb-4">
                Für die Anzeige von ÖPNV-Fahrplänen greifen wir auf die öffentliche API des
                Verkehrsverbunds Berlin-Brandenburg (VBB) zu. Dabei werden keine personenbezogenen
                Daten an den VBB übermittelt.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">SBAZV (Müllabfuhrtermine)</h3>
              <p className="text-slate-600 mb-4">
                Für die Anzeige von Müllabfuhrterminen greifen wir auf Daten des
                Südbrandenburgischen Abfallzweckverbandes (SBAZV) zu. Dabei wird Ihre
                eingegebene Adresse an den SBAZV übermittelt, um die korrekten Abholtermine
                zu ermitteln.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Open-Meteo (Wetterdaten)</h3>
              <p className="text-slate-600 mb-4">
                Für aktuelle Wetterdaten nutzen wir die Open-Meteo API.
                Dabei werden keine personenbezogenen Daten übertragen.
                Weitere Informationen: https://open-meteo.com/
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">OpenStreetMap</h3>
              <p className="text-slate-600 mb-4">
                Für die Kartenanzeige verwenden wir OpenStreetMap (OSM).
                Bei der Nutzung der Karte wird Ihre IP-Adresse an die Server der
                OpenStreetMap Foundation übertragen.
                Weitere Informationen: https://wiki.osmfoundation.org/wiki/Privacy_Policy
              </p>
            </section>

            {/* SSL */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                9. SSL- bzw. TLS-Verschlüsselung
              </h2>
              <p className="text-slate-600 mb-4">
                Diese Website nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                vertraulicher Inhalte, wie zum Beispiel Anfragen, die Sie an uns als
                Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte
                Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://"
                auf „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
              </p>
              <p className="text-slate-600 mb-4">
                Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die
                Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
              </p>
            </section>

            {/* Aktualität */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                10. Aktualität und Änderung dieser Datenschutzerklärung
              </h2>
              <p className="text-slate-600 mb-4">
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Januar 2026.
              </p>
              <p className="text-slate-600">
                Durch die Weiterentwicklung unserer Website und Angebote darüber oder aufgrund
                geänderter gesetzlicher beziehungsweise behördlicher Vorgaben kann es notwendig
                werden, diese Datenschutzerklärung zu ändern. Die jeweils aktuelle
                Datenschutzerklärung kann jederzeit auf dieser Website von Ihnen abgerufen und
                ausgedruckt werden.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
