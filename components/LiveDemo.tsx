'use client';
import { useEffect, useState } from 'react';

type Phase = 'drawing' | 'saving' | 'saved';
const CYCLE = 7600;

export default function LiveDemo() {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('drawing');
  const [savedTime, setSavedTime] = useState('');

  useEffect(() => {
    setPhase('drawing');
    const t1 = setTimeout(() => setPhase('saving'), 3600);
    const t2 = setTimeout(() => { setPhase('saved'); setSavedTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })); }, 4600);
    const t3 = setTimeout(() => setCycle(c => c + 1), CYCLE);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [cycle]);

  const badge = phase === 'drawing'
    ? { dot: '#f59e0b', text: '未保存改动' }
    : phase === 'saving'
    ? { dot: '#f59e0b', text: '正在保存…' }
    : { dot: '#22c55e', text: `已保存 ${savedTime}` };
  const caption = phase === 'drawing' ? '随手画，想到哪画到哪' : phase === 'saving' ? '停笔片刻，自动存到云端' : '关掉页面，换台设备打开还在';

  return (
    <div style={{ border: '1.5px solid #111', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '10px 12px 0 #7C3AED' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #eee' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>未命名画板</span>
        <span key={phase} className="demo-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#444', marginLeft: 'auto' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: badge.dot }} />{badge.text}
        </span>
      </div>
      <svg key={cycle} viewBox="0 0 560 340" style={{ display: 'block', width: '100%', height: 'auto' }} aria-label="自动保存演示画布">
        <defs>
          <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="#e3e0ea" /></pattern>
        </defs>
        <rect width="560" height="340" fill="url(#dots)" />
        {/* box 1 */}
        <path className="demo-draw" style={{ animationDelay: '.2s' }} pathLength={100} d="M62,66 L196,62 L200,142 L66,146 Z" fill="none" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
        <text className="demo-fade" style={{ animationDelay: '1s' }} x="96" y="112" fontSize="21" fill="#111" fontFamily="cursive">想法</text>
        {/* arrow */}
        <path className="demo-draw" style={{ animationDelay: '1.5s' }} pathLength={100} d="M206,102 C246,88 282,94 318,102" fill="none" stroke="#7C3AED" strokeWidth="2.5" />
        <path className="demo-draw" style={{ animationDelay: '2.1s' }} pathLength={100} d="M306,90 L322,102 L304,112" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinejoin="round" />
        {/* blob */}
        <path className="demo-draw" style={{ animationDelay: '2.2s' }} pathLength={100} d="M332,104 C334,76 372,56 408,58 C446,60 474,80 472,106 C470,134 440,154 403,154 C367,154 330,132 332,104 Z" fill="none" stroke="#111" strokeWidth="2.5" />
        <text className="demo-fade" style={{ animationDelay: '3s' }} x="376" y="112" fontSize="21" fill="#111" fontFamily="cursive">方案</text>
        {/* note box */}
        <path className="demo-draw" style={{ animationDelay: '2.7s' }} pathLength={100} d="M62,206 L238,202 L242,292 L66,296 Z" fill="none" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
        <path className="demo-draw" style={{ animationDelay: '3s' }} pathLength={100} d="M84,232 L214,230 M84,258 L180,256" fill="none" stroke="#bbb" strokeWidth="3" strokeLinecap="round" />
        {/* squiggle */}
        <path className="demo-draw" style={{ animationDelay: '3.1s' }} pathLength={100} d="M300,238 C330,208 356,262 386,232 C416,202 442,258 472,228 C492,208 506,224 518,216" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
        {/* cursor */}
        <circle className="demo-cursor" r="6" fill="#7C3AED" stroke="#fff" strokeWidth="2" />
      </svg>
      <div style={{ padding: '10px 14px', borderTop: '1px solid #eee', fontSize: 14, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
        <span key={caption} className="demo-fade" style={{ animationDelay: '0s' }}>{caption}</span>
        <span style={{ color: '#999' }}>循环演示</span>
      </div>
    </div>
  );
}
