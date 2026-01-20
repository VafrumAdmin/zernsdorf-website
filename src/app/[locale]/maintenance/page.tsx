import { Metadata } from 'next';
import { Wrench, Clock } from 'lucide-react';
import { getMaintenanceStatus } from '@/lib/admin/maintenance';

export const metadata: Metadata = {
  title: 'Wartungsmodus - ZernsdorfConnect',
  description: 'Die Website wird gerade gewartet.',
};

export default async function MaintenancePage() {
  const info = await getMaintenanceStatus();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const estimatedEndFormatted = formatDate(info.estimatedEnd);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-amber-500/30 rounded-full flex items-center justify-center">
                <Wrench className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            {/* Rotating gear effect */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center maintenance-spin-slow">
              <div className="w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-500"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Wartungsarbeiten
        </h1>

        {/* Message */}
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          {info.message || 'Die Website wird gerade gewartet. Bitte versuchen Sie es später erneut.'}
        </p>

        {/* Estimated End Time */}
        {estimatedEndFormatted && (
          <div className="mb-8 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Voraussichtliches Ende
              </p>
              <p className="text-slate-200 font-medium">
                {estimatedEndFormatted}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar Animation */}
        <div className="mb-8 max-w-xs mx-auto">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full maintenance-progress"></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Wir arbeiten daran, so schnell wie möglich wieder online zu sein.
          </p>
        </div>

        {/* Contact Info */}
        <div className="text-slate-400 text-sm">
          <p>Bei dringenden Anfragen erreichen Sie uns unter:</p>
          <a
            href="mailto:info@zernsdorf.info"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            info@zernsdorf.info
          </a>
        </div>

        {/* Brand */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            ZernsdorfConnect
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
