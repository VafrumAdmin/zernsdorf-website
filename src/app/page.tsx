import { redirect } from 'next/navigation';

// Redirect root to German locale
export default function RootPage() {
  redirect('/de');
}
