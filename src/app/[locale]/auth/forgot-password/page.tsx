'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Trees, Mail, Loader2, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ein Fehler ist aufgetreten');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              E-Mail gesendet
            </h1>
            <p className="text-slate-600 mb-6">
              Falls ein Konto mit der E-Mail-Adresse <strong>{email}</strong> existiert,
              haben wir Ihnen einen Link zum Zurücksetzen Ihres Passworts gesendet.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Bitte prüfen Sie auch Ihren Spam-Ordner.
            </p>
            <Link
              href="/auth/login"
              className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Trees className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">ZernsdorfConnect</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Anmeldung
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Passwort vergessen?
          </h1>
          <p className="text-slate-600 mb-8">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum
            Zurücksetzen Ihres Passworts.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="ihre@email.de"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Senden...
                </>
              ) : (
                'Link senden'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
