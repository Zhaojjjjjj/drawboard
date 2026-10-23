'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

type Drawing = { id: string; title: string; thumbnail_path: string | null; updated_at: string };

function relTime(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return '刚刚';
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  if (s < 86400 * 2) return '昨天';
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

// Deterministic placeholder sketch for boards without a thumbnail yet
function PlaceholderSketch({ seed }: { seed: string }) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 997;
  const x = 18 + (h % 40), y = 22 + (h % 26);
  return (
    <svg viewBox="0 0 260 150" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="260" height="150" fill="#fbfaff" />
      <path d={`M${x},${y} l92,-4 l3,52 l-94,4 Z`} fill="none" stroke="#c9c2dd" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${x + 108},${y + 14} c14,-10 34,8 20,20 c-12,10 -32,-4 -20,-20`} fill="none" stroke="#7C3AED" strokeWidth="2" />
      <path d={`M${x + 20},${y + 82} l120,0 M${x + 20},${y + 100} l74,0`} stroke="#ddd8ec" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function BoardsPage() {
  const [items, setItems] = useState<Drawing[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setEmail(user?.email ?? null);
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('drawings').select('id,title,thumbnail_path,updated_at').order('updated_at', { ascending: false });
    const list = data ?? []; setItems(list);
    const paths = list.map(d => d.thumbnail_path).filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('thumbnails').createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      list.forEach(d => { const s = signed?.find(x => x.path === d.thumbnail_path); if (d.thumbnail_path && s?.signedUrl) map[d.id] = s.signedUrl; });
      setThumbs(map);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!menuId) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuId(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuId(null); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menuId]);

  async function create() {
    if (!email) { router.push('/board/guest'); return; }
    const supabase = createClient();
    const { data, error } = await supabase.from('drawings').insert({ owner_id: (await supabase.auth.getUser()).data.user!.id }).select('id').single();
    if (!error && data) router.push(`/board/${data.id}`);
  }
  const [renameTarget, setRenameTarget] = useState<Drawing | null>(null);
  const [renameValue, setRenameValue] = useState('');
  function rename(d: Drawing) { setMenuId(null); setRenameTarget(d); setRenameValue(d.title); }
  async function submitRename() {
    const t = renameValue.trim(); if (!renameTarget || !t) return;
    await createClient().from('drawings').update({ title: t }).eq('id', renameTarget.id);
    setRenameTarget(null); load();
  }
  async function remove(d: Drawing) { setMenuId(null); if (!confirm(`删除「${d.title}」？删了就找不回来了。`)) return; await createClient().from('drawings').delete().eq('id', d.id); load(); }
  async function duplicate(d: Drawing) { setMenuId(null); const supabase = createClient(); const { data: full } = await supabase.from('drawings').select('*').eq('id', d.id).single(); if (!full) return; await supabase.from('drawings').insert({ owner_id: full.owner_id, title: full.title + ' 副本', scene: full.scene, thumbnail_path: full.thumbnail_path }); load(); }

  const shown = items.filter(d => d.title.includes(q));
  const initial = (email?.[0] ?? 'D').toUpperCase();

  return (
    <div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 28px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
        <Link href="/" style={{ color: 'inherit' }}><Logo size={26} /></Link>
        <div style={{ flex: 1 }} />
        {email ? <>
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#7C3AED', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }} title={email}>{initial}</span>
          <button className="btn ghost" onClick={async () => { await createClient().auth.signOut(); router.push('/'); }}>退出</button>
        </> : <Link className="btn ghost" href="/login">登录</Link>}
        <button className="btn" onClick={create}>+ 新建画板</button>
      </nav>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 30, margin: 0 }}>我的画板</h1>
          {!loading && email && <span style={{ color: '#999' }}>{items.length} 张 · 都已存在云端</span>}
          <div style={{ flex: 1 }} />
          <input className="input" placeholder="搜索画板…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 18, marginTop: 24 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 218 }} />)}
          </div>
        ) : !email ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1.5px dashed #ddd', borderRadius: 16, marginTop: 24 }}>
            <p style={{ fontSize: 18, margin: '0 0 8px' }}>登录后，你的画板都在这里</p>
            <p style={{ color: '#888', margin: '0 0 20px' }}>未登录也可以先画一张，暂存在这台设备上。</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button className="btn" onClick={create}>先画一张（游客）</button><Link className="btn ghost" href="/login">用 Google 登录</Link></div>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1.5px dashed #ddd', borderRadius: 16, marginTop: 24 }}>
            <p style={{ fontSize: 18, margin: '0 0 8px' }}>{q ? '没找到这个名字的画板' : '还没有画板'}</p>
            <p style={{ color: '#888', margin: '0 0 20px' }}>{q ? '换个关键词试试' : '画第一张吧，画完自动保存，不用操心存哪。'}</p>
            {!q && <button className="btn" onClick={create}>+ 新建画板</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 18, marginTop: 24 }}>
            {shown.map(d => (
              <div key={d.id} className="card" style={{ position: 'relative' }}>
                <div onClick={() => router.push(`/board/${d.id}`)} style={{ height: 150, overflow: 'hidden', background: '#fbfaff' }}>
                  {thumbs[d.id] ? <img src={thumbs[d.id]} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PlaceholderSketch seed={d.id} />}
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => router.push(`/board/${d.id}`)}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                    <div style={{ color: '#999', fontSize: 13, marginTop: 2 }}>{relTime(d.updated_at)} · 已保存</div>
                  </div>
                  <button aria-label="更多操作" onClick={() => setMenuId(menuId === d.id ? null : d.id)} style={{ border: 0, background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#666', padding: '0 4px' }}>···</button>
                </div>
                {menuId === d.id && (
                  <div ref={menuRef} style={{ position: 'absolute', right: 10, bottom: 52, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,.12)', padding: 6, zIndex: 3, minWidth: 128 }}>
                    {[['打开', () => router.push(`/board/${d.id}`)], ['重命名', () => rename(d)], ['复制一份', () => duplicate(d)], ['删除', () => remove(d)]].map(([label, fn]) => (
                      <button key={label as string} onClick={fn as () => void} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 14, color: label === '删除' ? '#dc2626' : '#111' }}>{label as string}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      {renameTarget && (
        <div onMouseDown={() => setRenameTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 16 }}>
          <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="重命名画板" style={{ background: '#fff', borderRadius: 16, padding: 22, width: 'min(400px,92vw)', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>重命名画板</h2>
            <p style={{ margin: '0 0 14px', color: '#888', fontSize: 14 }}>给这张画板起个一眼能认出的名字。</p>
            <input className="input" autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenameTarget(null); }}
              placeholder="画板名称" maxLength={60} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setRenameTarget(null)}>取消</button>
              <button className="btn" onClick={submitRename} disabled={!renameValue.trim()} style={{ opacity: renameValue.trim() ? 1 : .5 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
