import { redirect } from 'next/navigation';

// The app itself opens straight into the boards list.
// The marketing landing page lives as the repo's GitHub Pages site (docs/index.html).
// Logged-in users land on their own boards (session persists); anonymous
// visitors get the boards page's guest/login guidance.
export default function Home() {
  redirect('/boards');
}
