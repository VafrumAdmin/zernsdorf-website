'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Trees, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('E-Mail oder Passwort ist falsch');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse');
        } else {
          setError(err.message);
        }
      } else {
        setError('Ein Fehler ist aufgetreten');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Willkommen zurück
          </h1>
          <p className="text-slate-600 text-center mb-8">
            Melden Sie sich an, um fortzufahren
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Passwort vergessen?
              </Link>
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
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Noch kein Konto?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/auth/register"
            className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-center"
          >
            Kostenlos registrieren
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Mit der Anmeldung akzeptieren Sie unsere{' '}
          <Link href="/privacy" className="text-emerald-600 hover:underline">
            Datenschutzerklärung
          </Link>
        </p>
      </div>
    </div>
  );
}
