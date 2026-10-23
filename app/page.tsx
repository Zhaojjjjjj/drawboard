import Link from 'next/link';
export default function Home() {
  return (
    <main style={{maxWidth:880,margin:'0 auto',padding:'96px 24px',textAlign:'center'}}>
      <p style={{color:'#7C3AED',fontWeight:700,letterSpacing:2}}>DRAWBOARD</p>
      <h1 style={{fontSize:48,lineHeight:1.15,margin:'16px 0'}}>打开就能画，<br/>自动保存到云端</h1>
      <p style={{color:'#555',fontSize:18}}>手绘白板，体验和 Excalidraw 一样。区别是：登录后每一笔都自动存，不用导文件，清缓存也不丢。</p>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:32}}>
        <Link className="btn" href="/boards">开始画</Link>
        <Link className="btn ghost" href="/login">登录</Link>
      </div>
      <p style={{color:'#999',marginTop:20,fontSize:14}}>未登录也能画（存本地），登录后可一键同步到云端</p>
    </main>
  );
}
