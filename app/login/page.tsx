'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [msg, setMsg] = useState('');
  async function google() {
    const supabase = createClient();
    setMsg('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { access_type: 'offline', prompt: 'consent' } },
    });
    if (error) setMsg(error.message);
  }
  return (
    <main style={{maxWidth:380,margin:'80px auto',padding:24,textAlign:'center'}}>
      <h1 style={{fontSize:28}}>登录 Drawboard</h1>
      <p style={{color:'#666'}}>登录后画板自动保存到云端，换设备也能找回。</p>
      <button className="btn" style={{width:'100%',justifyContent:'center',marginTop:24}} onClick={google}>用 Google 登录</button>
      {msg && <p style={{color:'#dc2626',fontSize:14,marginTop:12}}>{msg}</p>}
      <p style={{color:'#999',fontSize:13,marginTop:16}}>未登录也可以先画，画板会暂存在这台设备上。</p>
    </main>
  );
}
