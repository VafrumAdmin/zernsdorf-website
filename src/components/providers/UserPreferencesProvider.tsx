'use client';

import { UserPreferencesProvider as Provider } from '@/hooks/useUserPreferences';
import { ReactNode } from 'react';

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}
