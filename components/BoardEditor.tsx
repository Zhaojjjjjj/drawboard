'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createAutosaver, SAVE_STATUS_LABEL, type SaveStatus } from '@/lib/autosave';
import Link from 'next/link';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, { ssr: false });

export default function BoardEditor({ id }: { id: string }) {
  const isGuest = id === 'guest';
  const supabase = useMemo(() => createClient(), []);
  const [initial, setInitial] = useState<any>(null);
  const [title, setTitle] = useState('未命名画板');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastVersionAt = useRef(0);
  const lastThumbAt = useRef(0);
  const apiRef = useRef<any>(null);

  // Best-effort thumbnail: at most once a minute, failures ignored
  // (e.g. until the 002 storage-policy SQL has been run).
  async function maybeThumbnail(sb: ReturnType<typeof createClient>) {
    if (Date.now() - lastThumbAt.current < 60_000) return;
    const api = apiRef.current; if (!api) return;
    try {
      const elements = api.getSceneElements();
      if (!elements?.length) return;
      lastThumbAt.current = Date.now();
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      const blob = await exportToBlob({ elements, appState: api.getAppState(), files: api.getFiles(), mimeType: 'image/png', maxWidthOrHeight: 640 });
      const user = (await sb.auth.getUser()).data.user; if (!user) return;
      const path = `${user.id}/${id}.png`;
      const { error } = await sb.storage.from('thumbnails').upload(path, blob, { upsert: true, contentType: 'image/png' });
      if (!error) await sb.from('drawings').update({ thumbnail_path: path }).eq('id', id);
    } catch { /* thumbnail is decorative; never break saving */ }
  }

  const saver = useMemo(() => createAutosaver({
    onStatus: (s, at) => { setStatus(s); if (at) setSavedAt(at); },
    save: async (scene: any) => {
      if (isGuest) { localStorage.setItem('drawboard-guest', JSON.stringify(scene)); return; }
      const { error } = await supabase.from('drawings').update({ scene, title, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      void maybeThumbnail(supabase);
      // version snapshot at most every 5 min (rollback safety net, UI in v1.1)
      if (Date.now() - lastVersionAt.current > 5 * 60_000) { lastVersionAt.current = Date.now(); await supabase.from('drawing_versions').insert({ drawing_id: id, scene }); }
    },
  }), [id, isGuest, supabase, title]);

  useEffect(() => { (async () => {
    if (isGuest) { try { setInitial(JSON.parse(localStorage.getItem('drawboard-guest') || 'null')); } catch { setInitial(null); } setInitial((v:any)=>v ?? { elements:[], appState:{}, files:{} }); return; }
    const { data } = await supabase.from('drawings').select('title,scene').eq('id', id).single();
    if (data) { setTitle(data.title); setInitial(data.scene ?? { elements:[], appState:{}, files:{} }); } else setInitial({ elements:[], appState:{}, files:{} });
  })(); }, [id, isGuest, supabase]);

  const onChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    // Skip the initial hydration echo: only save when elements reference changes after load is handled by debounce + dirty check in Excalidraw ecosystem;
    // we keep it simple and rely on user edits triggering changes.
    saver.push({ elements: [...elements], appState: { viewBackgroundColor: appState.viewBackgroundColor, currentItemFontFamily: appState.currentItemFontFamily }, files });
  }, [saver]);

  const dot = { saved:'#22c55e', saving:'#f59e0b', dirty:'#f59e0b', failed:'#ef4444' }[status];
  if (!initial) return <div style={{padding:80,textAlign:'center',color:'#666'}}>正在打开画布…</div>;
  return (
    <div style={{height:'100vh',position:'relative'}}>
      <div className="topbar">
        <Link href="/boards">← 我的画板</Link>
        {isGuest ? <span style={{fontWeight:600}}>游客画板（存本地）</span> : <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>{ if(!isGuest) supabase.from('drawings').update({title}).eq('id',id); }} style={{border:0,fontSize:16,fontWeight:600,outline:'none',minWidth:160}} />}
        <span style={{display:'inline-flex',alignItems:'center',gap:6,color:'#666',fontSize:14}}><span className="save-dot" style={{background:dot}} />{SAVE_STATUS_LABEL[status]}{status==='saved'&&savedAt?` ${savedAt.toLocaleTimeString('zh-CN')}`:''}</span>
        {status==='failed' && <button onClick={()=>saver.flush()}>重试</button>}
        {isGuest && <Link href="/login" style={{marginLeft:'auto'}}>登录后自动保存到云端 →</Link>}
      </div>
      <div className="excalidraw-wrap"><Excalidraw initialData={initial} onChange={onChange} langCode="zh-CN" excalidrawAPI={(api: any) => { apiRef.current = api; }} /></div>
    </div>
  );
}
