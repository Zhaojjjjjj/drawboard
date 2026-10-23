'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login'|'signup'>('login'); const [msg, setMsg] = useState('');
  const router = useRouter(); const supabase = createClient();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    const fn = mode === 'login' ? supabase.auth.signInWithPassword({email,password}) : supabase.auth.signUp({email,password});
    const { error } = await fn;
    if (error) setMsg(error.message); else if (mode==='signup') setMsg('注册成功，请查收邮箱确认后登录'); else router.push('/boards');
  }
  async function github() { await supabase.auth.signInWithOAuth({ provider:'github', options:{ redirectTo:`${location.origin}/auth/callback` } }); }
  return (
    <main style={{maxWidth:380,margin:'80px auto',padding:24}}>
      <h1 style={{fontSize:28}}>{mode==='login'?'登录 Drawboard':'注册 Drawboard'}</h1>
      <p style={{color:'#666'}}>登录后画板自动保存到云端，换设备也能找回。</p>
      <button className="btn ghost" style={{width:'100%',justifyContent:'center',margin:'16px 0'}} onClick={github}>用 GitHub 登录</button>
      <div style={{textAlign:'center',color:'#999',margin:'8px 0'}}>或用邮箱</div>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <input className="input" type="email" required placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" required placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} />
        {msg && <p style={{color:'#dc2626',fontSize:14}}>{msg}</p>}
        <button className="btn" style={{justifyContent:'center'}}>{mode==='login'?'登录':'注册'}</button>
      </form>
      <p style={{marginTop:16,fontSize:14}}>{mode==='login'?'还没有账号？':'已有账号？'} <a href="#" onClick={e=>{e.preventDefault();setMode(mode==='login'?'signup':'login');}}>{mode==='login'?'注册':'登录'}</a></p>
    </main>
  );
}
