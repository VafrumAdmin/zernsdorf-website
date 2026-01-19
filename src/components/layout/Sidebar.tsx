'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves,
  Activity,
  Map,
  Calendar,
  MessageCircle,
  Trash2,
  Construction,
  BookOpen,
  User,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LogIn,
  Sun,
  Droplets,
  Wind,
  Train,
} from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    { href: '/transit', label: 'ÖPNV', icon: Train },
    { href: '/map', label: 'Karte', icon: Map },
    { href: '/waste', label: t('waste'), icon: Trash2, badge: 2 },
    { href: '/traffic', label: t('traffic'), icon: Construction },
    { href: '/events', label: t('events'), icon: Calendar, badge: 3 },
    { href: '/community', label: 'Community', icon: MessageCircle, badge: 5 },
    { href: '/history', label: t('history'), icon: BookOpen },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden btn-icon"
      >
        {isMobileOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-40 bg-[#0a0a12] border-r border-white/5 flex flex-col transition-all duration-300 ${sidebarWidth} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-white/5 ${isCollapsed ? 'px-4' : 'px-6'}`}>
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] via-[#a855f7] to-[#f43f5e] p-[2px] flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full rounded-xl bg-[#0a0a12] flex items-center justify-center">
                <Waves className="w-5 h-5 text-[#00d4ff]" />
              </div>
            </motion.div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-lg font-bold gradient-text">Zernsdorf</span>
                <span className="block text-[10px] text-[#71717a] uppercase tracking-widest">
                  Digital Village
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Quick Stats (only when expanded) */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-white/5"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-white/5">
                <Sun className="w-4 h-4 mx-auto mb-1 text-[#f59e0b]" />
                <span className="text-xs">18°C</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-[#00d4ff]" />
                <span className="text-xs">21°C</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/5">
                <Wind className="w-4 h-4 mx-auto mb-1 text-[#71717a]" />
                <span className="text-xs">12 km/h</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                      isActive
                        ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                        : 'text-[#71717a] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00d4ff] rounded-r-full"
                      />
                    )}
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#f43f5e] rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#f43f5e] rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Language Switcher */}
          <div className={`${isCollapsed ? 'px-2' : 'px-3'}`}>
            <LanguageSwitcher collapsed={isCollapsed} />
          </div>

          {/* Notifications */}
          <button
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#71717a] hover:bg-white/5 hover:text-white transition-all relative ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Bell className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm">Benachrichtigungen</span>}
            <span className="absolute top-2 right-2 w-4 h-4 bg-[#f43f5e] rounded-full text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Settings */}
          <button
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#71717a] hover:bg-white/5 hover:text-white transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm">Einstellungen</span>}
          </button>

          {/* Login Button */}
          <Link
            href="/auth/login"
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-medium text-sm transition-all hover:opacity-90 ${
              isCollapsed ? 'px-3' : ''
            }`}
          >
            <LogIn className="w-4 h-4" />
            {!isCollapsed && <span>Anmelden</span>}
          </Link>

          {/* Collapse Toggle (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#71717a] hover:bg-white/5 hover:text-white transition-all text-xs"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Einklappen</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Spacer */}
      <div className={`hidden lg:block transition-all duration-300 ${sidebarWidth}`} />
    </>
  );
}
