import Link from 'next/link';
import LiveDemo from '@/components/LiveDemo';
import { Logo } from '@/components/Logo';

const FEATURES = [
  { title: '停笔就存', desc: '画完不用导文件、不用按保存。停笔片刻自动存到云端，顶栏实时告诉你存没存上。', icon: <path d="M5 13 a7 7 0 1 1 2 5 L5 13 Z M8 13 l3 3 l5 -6" stroke="#7C3AED" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(1,-1)" /> },
  { title: '历史都在', desc: '每张画板都在你的列表里，带封面缩略图，一眼认出。换电脑、清缓存，都能找回。', icon: <g stroke="#7C3AED" strokeWidth="2" fill="none"><rect x="4" y="4" width="16" height="12" rx="2" /><path d="M4 20 h16" strokeLinecap="round" /></g> },
  { title: '导出自由', desc: 'PNG、SVG 随时导出，也能存成 .excalidraw 文件带走。你的画，永远是你的。', icon: <g stroke="#7C3AED" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 v10 M8 10 l4 4 l4 -4 M5 20 h14" /></g> },
];

export default function Home() {
  return (
    <div>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', maxWidth: 1180, margin: '0 auto' }}>
        <Logo />
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link className="btn ghost" href="/login">登录</Link>
          <Link className="btn" href="/boards">开始画</Link>
        </span>
      </nav>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 28px 20px' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 44, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#7C3AED', fontWeight: 700, letterSpacing: 2, margin: 0 }}>会自己保存的白板</p>
            <h1 className="hero-title">打开就能画，<br />自动保存到云端</h1>
            <p style={{ color: '#555', fontSize: 18, lineHeight: 1.65, margin: '0 0 28px' }}>手绘白板，画起来和 Excalidraw 一样顺手。区别只有一条，但很重要：登录后每一笔都自动存，再也不用导文件，也不会清个缓存就全没了。</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="btn" href="/boards" style={{ padding: '13px 26px', fontSize: 16 }}>开始画 →</Link>
              <Link className="btn ghost" href="/login" style={{ padding: '13px 22px', fontSize: 16 }}>用 Google 登录</Link>
            </div>
            <p style={{ color: '#999', marginTop: 16, fontSize: 14 }}>未登录也能先画（暂存本地），登录后同步到云端</p>
          </div>
          <LiveDemo />
        </div>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginTop: 72 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ border: '1px solid #eee', borderRadius: 14, padding: 22 }}>
              <svg width="30" height="30" viewBox="0 0 24 24">{f.icon}</svg>
              <h3 style={{ margin: '12px 0 6px', fontSize: 18 }}>{f.title}</h3>
              <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </section>
        <footer style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 14, padding: '44px 0 28px', marginTop: 40, borderTop: '1px solid #f0f0f0' }}>
          <span>Drawboard — 打开就能画，自动保存到云端</span>
          <Link href="/boards">我的画板</Link>
        </footer>
      </main>
    </div>
  );
}
