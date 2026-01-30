import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen',
  description: 'Nutzungsbedingungen von Zernsdorf.info',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Nutzungsbedingungen
          </h1>

          <div className="prose prose-slate max-w-none">
            {/* Geltungsbereich */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                1. Geltungsbereich
              </h2>
              <p className="text-slate-600 mb-4">
                Diese Nutzungsbedingungen gelten fuer die Nutzung der Website zernsdorf.info
                (nachfolgend "Website" genannt) und aller damit verbundenen Dienste.
                Mit der Nutzung der Website erklaeren Sie sich mit diesen Nutzungsbedingungen einverstanden.
              </p>
              <p className="text-slate-600 mb-4">
                Betreiber der Website ist:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-slate-700">
                  Jonas Hauke<br />
                  Karl-Marx-Str. 77<br />
                  15712 Koenigs Wusterhausen<br />
                  Deutschland<br />
                  <br />
                  E-Mail: info@zernsdorf.info
                </p>
              </div>
            </section>

            {/* Leistungsbeschreibung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                2. Leistungsbeschreibung
              </h2>
              <p className="text-slate-600 mb-4">
                Zernsdorf.info ist ein digitales Dorfportal fuer Zernsdorf und Umgebung.
                Die Website bietet folgende Dienste:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Muellabfuhrtermine und Abfallkalender</li>
                <li>OEPNV-Fahrplaene und Verbindungsauskunft</li>
                <li>Verkehrsinformationen und Baustellenuebersicht</li>
                <li>Wetterdaten</li>
                <li>Veranstaltungskalender</li>
                <li>Branchenverzeichnis lokaler Unternehmen</li>
                <li>Informationen zur Ortsgeschichte</li>
                <li>Forum und Community-Funktionen (fuer registrierte Nutzer)</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Die Nutzung der meisten Funktionen ist kostenlos und ohne Registrierung moeglich.
                Bestimmte Funktionen wie das Forum oder personalisierte Einstellungen
                erfordern eine kostenlose Registrierung.
              </p>
            </section>

            {/* Registrierung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                3. Registrierung und Benutzerkonto
              </h2>
              <p className="text-slate-600 mb-4">
                Fuer bestimmte Funktionen ist eine Registrierung erforderlich.
                Bei der Registrierung muessen Sie wahrheitsgemaesse Angaben machen.
                Sie sind verpflichtet, Ihre Zugangsdaten geheim zu halten und vor
                dem Zugriff Dritter zu schuetzen.
              </p>
              <p className="text-slate-600 mb-4">
                Sie koennen Ihr Benutzerkonto jederzeit loeschen. Wenden Sie sich
                dazu an info@zernsdorf.info oder nutzen Sie die Funktion in Ihren
                Kontoeinstellungen.
              </p>
            </section>

            {/* Nutzungsregeln */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                4. Nutzungsregeln
              </h2>
              <p className="text-slate-600 mb-4">
                Bei der Nutzung der Website und insbesondere bei der Erstellung
                von Beitraegen im Forum oder anderen Community-Bereichen sind
                folgende Regeln zu beachten:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Respektvoller Umgang miteinander</li>
                <li>Keine Beleidigungen, Diffamierungen oder Hassrede</li>
                <li>Keine rechtswidrigen Inhalte</li>
                <li>Keine Werbung ohne vorherige Genehmigung</li>
                <li>Keine Spam-Beitraege oder Massennachrichten</li>
                <li>Keine falschen oder irrefuehrenden Informationen</li>
                <li>Beachtung der Urheberrechte Dritter</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Verstoesse gegen diese Regeln koennen zur Loeschung von Beitraegen
                und im Wiederholungsfall zur Sperrung des Benutzerkontos fuehren.
              </p>
            </section>

            {/* Haftung */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                5. Haftungsausschluss
              </h2>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Inhalte der Website</h3>
              <p className="text-slate-600 mb-4">
                Die Inhalte dieser Website werden mit groesster Sorgfalt erstellt.
                Fuer die Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte
                koennen wir jedoch keine Gewaehr uebernehmen. Dies gilt insbesondere fuer:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-1">
                <li>Muellabfuhrtermine (Quelle: SBAZV)</li>
                <li>Fahrplandaten (Quelle: VBB)</li>
                <li>Verkehrsinformationen und Baustellen</li>
                <li>Wetterdaten (Quelle: Open-Meteo)</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Verbindliche Informationen erhalten Sie direkt bei den jeweiligen
                Anbietern und Behoerden.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Externe Links</h3>
              <p className="text-slate-600 mb-4">
                Diese Website enthaelt Links zu externen Websites Dritter, auf deren
                Inhalte wir keinen Einfluss haben. Fuer die Inhalte der verlinkten
                Seiten ist stets der jeweilige Anbieter verantwortlich.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-2">Nutzerbeitraege</h3>
              <p className="text-slate-600 mb-4">
                Fuer von Nutzern erstellte Inhalte (Forum, Kommentare etc.) sind
                die jeweiligen Nutzer selbst verantwortlich. Wir pruefen nicht alle
                Beitraege vor der Veroeffentlichung, behalten uns aber das Recht vor,
                rechtswidrige oder gegen diese Nutzungsbedingungen verstossende
                Inhalte zu entfernen.
              </p>
            </section>

            {/* Urheberrecht */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                6. Urheberrecht
              </h2>
              <p className="text-slate-600 mb-4">
                Die durch den Betreiber erstellten Inhalte und Werke auf dieser
                Website unterliegen dem deutschen Urheberrecht. Die Vervielfaeltigung,
                Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der
                Grenzen des Urheberrechts beduerfen der schriftlichen Zustimmung des
                Betreibers.
              </p>
              <p className="text-slate-600 mb-4">
                Soweit die Inhalte auf dieser Website nicht vom Betreiber erstellt
                wurden, werden die Urheberrechte Dritter beachtet. Sollten Sie
                trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten
                wir um einen entsprechenden Hinweis.
              </p>
            </section>

            {/* Verfuegbarkeit */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                7. Verfuegbarkeit
              </h2>
              <p className="text-slate-600 mb-4">
                Wir bemuehen uns, die Website moeglichst unterbrechungsfrei zur
                Verfuegung zu stellen. Ein Anspruch auf staendige Verfuegbarkeit
                besteht jedoch nicht. Wir behalten uns vor, die Website oder
                einzelne Funktionen jederzeit zu aendern, einzuschraenken oder
                einzustellen.
              </p>
            </section>

            {/* Aenderungen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                8. Aenderungen der Nutzungsbedingungen
              </h2>
              <p className="text-slate-600 mb-4">
                Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu aendern.
                Die aktuelle Version ist stets auf dieser Website abrufbar.
                Bei wesentlichen Aenderungen werden registrierte Nutzer per E-Mail
                informiert.
              </p>
            </section>

            {/* Schlussbestimmungen */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                9. Schlussbestimmungen
              </h2>
              <p className="text-slate-600 mb-4">
                Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne
                Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden,
                bleibt die Wirksamkeit der uebrigen Bestimmungen unberuehrt.
              </p>
              <p className="text-slate-600">
                Stand: Januar 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
