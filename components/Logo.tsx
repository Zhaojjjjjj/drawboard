export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: size, height: size, borderRadius: 8, background: '#7C3AED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"><path d="M4 15 C7 8 10 17 13 10 C15 6 17 8 20 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="20" cy="17" r="1.8" fill="#fff" /></svg>
      </span>
      <span style={{ fontWeight: 800, fontSize: size * 0.62, letterSpacing: -.3 }}>Drawboard</span>
    </span>
  );
}
