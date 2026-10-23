'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Drawing = { id:string; title:string; thumbnail_path:string|null; updated_at:string };

export default function BoardsPage() {
  const [items, setItems] = useState<Drawing[]>([]); const [user, setUser] = useState<string|null>(null); const [q,setQ]=useState('');
  const supabase = createClient(); const router = useRouter();
  async function load() {
    const { data:{user} } = await supabase.auth.getUser(); setUser(user?.email ?? null);
    if (!user) return;
    const { data } = await supabase.from('drawings').select('id,title,thumbnail_path,updated_at').order('updated_at',{ascending:false});
    setItems(data ?? []);
  }
  useEffect(()=>{ load(); },[]);
  async function create() {
    if (!user) { router.push('/board/guest'); return; }
    const { data, error } = await supabase.from('drawings').insert({ owner_id:(await supabase.auth.getUser()).data.user!.id }).select('id').single();
    if (!error && data) router.push(`/board/${data.id}`);
  }
  async function rename(d:Drawing){ const t=prompt('画板名称',d.title); if(!t) return; await supabase.from('drawings').update({title:t}).eq('id',d.id); load(); }
  async function remove(d:Drawing){ if(!confirm(`删除「${d.title}」？`)) return; await supabase.from('drawings').delete().eq('id',d.id); load(); }
  async function duplicate(d:Drawing){ const {data:full}=await supabase.from('drawings').select('*').eq('id',d.id).single(); if(!full) return; const {owner_id,...rest}=full; const {data}=await supabase.from('drawings').insert({owner_id,title:full.title+' 副本',scene:full.scene}).select('id').single(); if(data) load(); }
  const shown = items.filter(d=>d.title.includes(q));
  if (user===null) return <main style={{maxWidth:720,margin:'80px auto',padding:24,textAlign:'center'}}><h1>我的画板</h1><p style={{color:'#666'}}>登录后可查看云端画板；未登录也可以先画一张（存本地）。</p><div style={{display:'flex',gap:12,justifyContent:'center'}}><button className="btn" onClick={create}>新建画板（游客）</button><Link className="btn ghost" href="/login">登录</Link></div></main>;
  return (
    <main style={{maxWidth:1000,margin:'0 auto',padding:'32px 24px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1>我的画板</h1><div style={{display:'flex',gap:10,alignItems:'center'}}><span style={{color:'#666',fontSize:14}}>{user}</span><button className="btn" onClick={create}>+ 新建画板</button><button className="btn ghost" onClick={async()=>{await supabase.auth.signOut();router.push('/');}}>退出</button></div></header>
      <input className="input" placeholder="搜索画板…" value={q} onChange={e=>setQ(e.target.value)} style={{margin:'16px 0'}} />
      {shown.length===0 ? <p style={{color:'#999'}}>还没有画板，点「新建画板」画第一张。</p> : (
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
        {shown.map(d=>(
          <div key={d.id} className="card">
            <div onClick={()=>router.push(`/board/${d.id}`)} style={{height:140,background:'#f8f7ff',display:'flex',alignItems:'center',justifyContent:'center',color:'#7C3AED'}}>打开画板</div>
            <div style={{padding:12}}><div style={{fontWeight:600}}>{d.title}</div><div style={{color:'#999',fontSize:13}}>{new Date(d.updated_at).toLocaleString('zh-CN')}</div>
            <div style={{display:'flex',gap:8,marginTop:8}}><button onClick={()=>rename(d)}>重命名</button><button onClick={()=>duplicate(d)}>复制</button><button onClick={()=>remove(d)}>删除</button></div></div>
          </div>))}
      </div>)}
    </main>
  );
}
