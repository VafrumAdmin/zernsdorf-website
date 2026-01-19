// Theme-System für Zernsdorf Connect

export interface Theme {
  id: string;
  name: string;
  primary: string;
  bg: string;
  bgDark: string;
  bgLight: string;
  border: string;
  accent: string;
  hoverBg: string;
  iconBg: string;
  ring: string;
}

export const themes: Record<string, Theme> = {
  teal: {
    id: 'teal',
    name: 'Original',
    primary: 'text-teal-600',
    bg: 'bg-teal-600',
    bgDark: 'bg-teal-900',
    bgLight: 'bg-teal-50',
    border: 'border-teal-200',
    accent: 'text-teal-100',
    hoverBg: 'hover:bg-teal-600',
    iconBg: 'bg-teal-50',
    ring: 'ring-teal-500',
  },
  blue: {
    id: 'blue',
    name: 'Seeblick',
    primary: 'text-blue-600',
    bg: 'bg-blue-600',
    bgDark: 'bg-blue-900',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'text-blue-100',
    hoverBg: 'hover:bg-blue-600',
    iconBg: 'bg-blue-50',
    ring: 'ring-blue-500',
  },
  green: {
    id: 'green',
    name: 'Waldweg',
    primary: 'text-emerald-600',
    bg: 'bg-emerald-600',
    bgDark: 'bg-emerald-900',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-100',
    hoverBg: 'hover:bg-emerald-600',
    iconBg: 'bg-emerald-50',
    ring: 'ring-emerald-500',
  },
  orange: {
    id: 'orange',
    name: 'Ziegel',
    primary: 'text-orange-600',
    bg: 'bg-orange-600',
    bgDark: 'bg-orange-900',
    bgLight: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'text-orange-100',
    hoverBg: 'hover:bg-orange-600',
    iconBg: 'bg-orange-50',
    ring: 'ring-orange-500',
  },
};

export const defaultTheme = 'teal';
