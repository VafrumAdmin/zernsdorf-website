import { readFile } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './config';

const MAINTENANCE_FILE = join(process.cwd(), '.maintenance');

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  estimatedEnd: string | null;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const content = await readFile(MAINTENANCE_FILE, 'utf-8');
    const data = JSON.parse(content);
    return {
      enabled: true,
      message: data.message || 'Die Website wird gerade gewartet.',
      estimatedEnd: data.estimatedEnd || null,
    };
  } catch {
    return {
      enabled: false,
      message: '',
      estimatedEnd: null,
    };
  }
}

export async function isAdminLoggedIn(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE);
    return !!session?.value;
  } catch {
    return false;
  }
}

export async function shouldShowMaintenancePage(): Promise<boolean> {
  const status = await getMaintenanceStatus();
  if (!status.enabled) return false;

  const isAdmin = await isAdminLoggedIn();
  return !isAdmin;
}

export async function getMaintenanceInfo(): Promise<MaintenanceStatus & { shouldShow: boolean }> {
  const status = await getMaintenanceStatus();
  const shouldShow = await shouldShowMaintenancePage();
  return {
    ...status,
    shouldShow,
  };
}
