import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Drawboard — 自动保存的手绘白板', description: '打开就能画，登录后自动保存到云端，不再丢稿。' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
