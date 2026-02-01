'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, Trees, Search, User, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Schließe User-Menü bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Schließe Menüs bei Escape-Taste
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const navItems = [
    { href: '/', label: 'Startseite' },
    { href: '/mobility', label: 'Mobilität' },
    { href: '/events', label: t('events') },
    { href: '/waste', label: t('waste') },
    { href: '/history', label: t('history') },
  ];

  return (
    <>
      {/* Skip-Link für Tastaturnutzer */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
      >
        Zum Hauptinhalt springen
      </a>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-white'
        }`}
        role="banner"
      >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center transition-colors`}>
              <Trees className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className={`text-lg font-bold ${theme.primary} transition-colors`}>
                ZernsdorfConnect
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Hauptnavigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? `${theme.bgLight} ${theme.primary}`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              aria-label="Suche öffnen"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            <LanguageSwitcher />

            {/* User / Login Button */}
            {isLoading ? (
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" aria-label="Lade Benutzerdaten" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`hidden sm:flex items-center gap-2 ${theme.bg} hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label={`Benutzermenü für ${user.username || user.email?.split('@')[0]}`}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>{user.username || user.email?.split('@')[0]}</span>
                </button>
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-label="Benutzermenü"
                  >
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100"
                      onClick={() => setShowUserMenu(false)}
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100"
                      onClick={() => setShowUserMenu(false)}
                      role="menuitem"
                    >
                      Profil bearbeiten
                    </Link>
                    <hr className="my-2 border-slate-200" role="separator" />
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus-visible:bg-red-50 flex items-center gap-2"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={`hidden sm:flex items-center gap-2 ${theme.bg} hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span>{t('login')}</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {isMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200" id="mobile-menu">
            <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
                      isActive
                        ? `${theme.bgLight} ${theme.primary}`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="mt-2 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Abmelden
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className={`mt-2 flex items-center justify-center gap-2 ${theme.bg} hover:opacity-90 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>{t('login')}</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
