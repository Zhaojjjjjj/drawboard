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
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; avatar_path: string | null } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarVer, setAvatarVer] = useState(0);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
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
    setUid(user.id);
    const { data: prof } = await supabase.from('profiles').select('display_name,avatar_path').eq('id', user.id).maybeSingle();
    setProfile(prof ?? { display_name: '', avatar_path: null });
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
  const displayName = profile?.display_name?.trim() || (email ? email.split('@')[0] : '');
  const avatarUrl = profile?.avatar_path ? createClient().storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl + `?v=${avatarVer}` : null;
  function Avatar({ size }: { size: number }) {
    if (avatarUrl) return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />;
    return <span style={{ width: size, height: size, borderRadius: '50%', background: '#7C3AED', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(size * 0.45) }}>{(displayName?.[0] ?? 'D').toUpperCase()}</span>;
  }
  const menuItemStyle: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14.5 };
  async function persistProfile(display_name: string, avatar_path: string | null) {
    if (!uid) return false;
    const { error } = await createClient().from('profiles').upsert({ id: uid, display_name, avatar_path, updated_at: new Date().toISOString() });
    if (error) return false;
    setProfile({ display_name, avatar_path }); return true;
  }
  async function saveName() {
    setProfileBusy(true); setProfileMsg('');
    const ok = await persistProfile(nameDraft.trim(), profile?.avatar_path ?? null);
    setProfileBusy(false);
    if (ok) { setProfileMsg('已保存'); setTimeout(() => setSettingsOpen(false), 450); } else setProfileMsg('保存失败，请稍后再试');
  }
  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || !uid) return;
    setProfileBusy(true); setProfileMsg('');
    try {
      const bmp = await createImageBitmap(f);
      const side = Math.min(bmp.width, bmp.height);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
      cv.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
      const blob = await new Promise<Blob | null>(r => cv.toBlob(r, 'image/jpeg', 0.85));
      if (!blob) throw new Error('bad image');
      const path = `${uid}/avatar.jpg`;
      const { error } = await createClient().storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const ok = await persistProfile(nameDraft || profile?.display_name || '', path);
      if (ok) { setAvatarVer(Date.now()); setProfileMsg('头像已更新'); } else setProfileMsg('保存失败，请稍后再试');
    } catch { setProfileMsg('头像上传失败，请稍后再试'); }
    setProfileBusy(false);
  }

  return (
    <div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 28px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
        <Link href="/" style={{ color: 'inherit' }}><Logo size={26} /></Link>
        <div style={{ flex: 1 }} />
        {email ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserMenuOpen(o => !o)} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, padding: 0 }}>
              <Avatar size={34} />
              <span style={{ fontSize: 14, color: '#333', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
            </button>
            {userMenuOpen && <>
              <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 8 }} />
              <div style={{ position: 'absolute', right: 0, top: 46, background: '#fff', border: '1px solid #eee', borderRadius: 12, boxShadow: '0 14px 40px rgba(0,0,0,.14)', padding: 8, zIndex: 9, width: 230 }}>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600 }}>{displayName}</div>
                  <div style={{ color: '#999', fontSize: 13, marginTop: 1 }}>{email}</div>
                </div>
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                <button onClick={() => { setUserMenuOpen(false); setNameDraft(profile?.display_name ?? ''); setProfileMsg(''); setSettingsOpen(true); }} style={menuItemStyle}>账户设置</button>
                <button onClick={async () => { await createClient().auth.signOut(); router.push('/'); }} style={menuItemStyle}>退出登录</button>
              </div>
            </>}
          </div>
        ) : <Link className="btn ghost" href="/login">登录</Link>}
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
      {settingsOpen && (
        <div onMouseDown={() => setSettingsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: 16 }}>
          <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="账户设置" style={{ background: '#fff', borderRadius: 16, padding: 22, width: 'min(400px,92vw)', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
            <h2 style={{ margin: 0, fontSize: 19 }}>账户设置</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0 16px' }}>
              <Avatar size={64} />
              <div>
                <label className="btn ghost" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: 14 }}>更换头像<input type="file" accept="image/*" hidden onChange={pickAvatar} /></label>
                <p style={{ color: '#999', fontSize: 13, margin: '7px 0 0' }}>选一张图，自动裁成正方形。</p>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 7 }}>显示名称</label>
            <input className="input" value={nameDraft} onChange={e => setNameDraft(e.target.value)} placeholder="给自己起个名字" maxLength={24}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setSettingsOpen(false); }} />
            {profileMsg && <p style={{ color: profileMsg.includes('失败') ? '#dc2626' : '#16a34a', fontSize: 14, margin: '12px 0 0' }}>{profileMsg}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setSettingsOpen(false)}>取消</button>
              <button className="btn" onClick={saveName} disabled={profileBusy} style={{ opacity: profileBusy ? .5 : 1 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
