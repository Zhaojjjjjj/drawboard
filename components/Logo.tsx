export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: size, height: size, borderRadius: 8, background: '#7C3AED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 64 64" fill="none">
          <path d="M42 14 H16 V50 H50 V31" stroke="#fff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="53" cy="14" r="5" fill="#fff" />
        </svg>
      </span>
      <span style={{ fontWeight: 800, fontSize: size * 0.62, letterSpacing: -.3 }}>Drawboard</span>
    </span>
  );
}
