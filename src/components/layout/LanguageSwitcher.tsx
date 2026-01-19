'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

export function LanguageSwitcher({ collapsed = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: 'de' | 'en') => {
    router.replace(pathname, { locale: newLocale });
  };

  if (collapsed) {
    return (
      <button
        onClick={() => switchLocale(locale === 'de' ? 'en' : 'de')}
        className="w-full flex items-center justify-center py-3 rounded-xl text-[#71717a] hover:bg-white/5 hover:text-white transition-all"
      >
        <Globe className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 p-1 bg-white/5">
      <button
        onClick={() => switchLocale('de')}
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
          locale === 'de'
            ? 'bg-[#00d4ff] text-white'
            : 'text-[#71717a] hover:text-white'
        }`}
        aria-label="Deutsch"
      >
        DE
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
          locale === 'en'
            ? 'bg-[#00d4ff] text-white'
            : 'text-[#71717a] hover:text-white'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
