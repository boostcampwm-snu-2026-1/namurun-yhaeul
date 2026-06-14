interface Props {
  size?: number
  className?: string
}

export function NamurunLogo({ size = 64, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="나무런 로고"
    >
      {/* Tree trunk */}
      <rect x="29" y="38" width="6" height="16" rx="1" fill="var(--color-primary-container)" />

      {/* Tree canopy — layered triangles */}
      <polygon points="32,6 50,36 14,36" fill="var(--color-primary)" />
      <polygon points="32,14 47,34 17,34" fill="var(--color-primary-container)" opacity="0.6" />

      {/* Speed dash lines */}
      <line x1="52" y1="20" x2="60" y2="20" stroke="var(--color-tertiary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="54" y1="26" x2="60" y2="26" stroke="var(--color-tertiary)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="56" y1="32" x2="60" y2="32" stroke="var(--color-tertiary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}
