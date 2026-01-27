'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Trees, Mail, Lock, Eye, EyeOff, Loader2, User, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setError('Bitte akzeptieren Sie die Nutzungsbedingungen und Datenschutzerklärung');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (!isPasswordValid) {
      setError('Das Passwort erfüllt nicht alle Anforderungen');
      return;
    }

    if (formData.username.length < 3) {
      setError('Der Benutzername muss mindestens 3 Zeichen lang sein');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        username: formData.username,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
      });

      setSuccess('Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach und bestätigen Sie Ihre E-Mail-Adresse.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('Diese E-Mail-Adresse ist bereits registriert');
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Fast geschafft!
            </h1>
            <p className="text-slate-600 mb-6">
              {success}
            </p>
            <Link
              href="/auth/login"
              className="inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 py-12">
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Konto erstellen
          </h1>
          <p className="text-slate-600 text-center mb-8">
            Werden Sie Teil der Zernsdorf-Community
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
                E-Mail-Adresse *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="ihre@email.de"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Benutzername *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="mein_benutzername"
                  minLength={3}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Mindestens 3 Zeichen, keine Sonderzeichen
              </p>
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                  Vorname
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Max"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                  Nachname
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Mustermann"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Passwort *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {[
                    { key: 'length', label: 'Mindestens 8 Zeichen' },
                    { key: 'uppercase', label: 'Ein Großbuchstabe' },
                    { key: 'lowercase', label: 'Ein Kleinbuchstabe' },
                    { key: 'number', label: 'Eine Zahl' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 text-xs ${
                        passwordChecks[key as keyof typeof passwordChecks]
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password Confirm */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-slate-700 mb-2">
                Passwort bestätigen *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    formData.passwordConfirm && formData.password !== formData.passwordConfirm
                      ? 'border-red-300'
                      : 'border-slate-300'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="mt-1 text-xs text-red-500">
                  Die Passwörter stimmen nicht überein
                </p>
              )}
            </div>

            {/* Terms & Privacy */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-slate-600">
                  Ich akzeptiere die{' '}
                  <Link href="/terms" className="text-emerald-600 hover:underline">
                    Nutzungsbedingungen
                  </Link>{' '}
                  *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-slate-600">
                  Ich habe die{' '}
                  <Link href="/privacy" className="text-emerald-600 hover:underline">
                    Datenschutzerklärung
                  </Link>{' '}
                  gelesen und akzeptiert *
                </span>
              </label>
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
                  Registrieren...
                </>
              ) : (
                'Registrieren'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Bereits registriert?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-center"
          >
            Zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
