'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, X, Trees, Search, User } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Startseite' },
    { href: '/mobility', label: 'Mobilität' },
    { href: '/events', label: t('events') },
    { href: '/waste', label: t('waste') },
    { href: '/history', label: t('history') },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white'
      }`}
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
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? `${theme.bgLight} ${theme.primary}`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>

            <LanguageSwitcher />

            {/* Login Button */}
            <Link
              href="/auth/login"
              className={`hidden sm:flex items-center gap-2 ${theme.bg} hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            >
              <User className="w-4 h-4" />
              <span>{t('login')}</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? `${theme.bgLight} ${theme.primary}`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/auth/login"
                className={`mt-2 flex items-center justify-center gap-2 ${theme.bg} hover:opacity-90 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all`}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
