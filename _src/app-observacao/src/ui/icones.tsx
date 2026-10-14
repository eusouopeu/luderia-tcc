/** Bolo de aniversário (o Heroicons não tem), no traço do outline 24. */
export function BoloIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3.75 20.25h16.5M4.5 20.25v-6a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25v6" />
      <path d="M4.5 15.75c1.25 0 1.25.9 2.5.9s1.25-.9 2.5-.9 1.25.9 2.5.9 1.25-.9 2.5-.9 1.25.9 2.5.9 1.25-.9 2.5-.9" />
      <path d="M6.75 12v-1.5A1.5 1.5 0 0 1 8.25 9h7.5a1.5 1.5 0 0 1 1.5 1.5V12M9 9V7.5M12 9V7.5M15 9V7.5" />
      <circle cx="9" cy="4.5" r=".6" fill="currentColor" />
      <circle cx="12" cy="4.5" r=".6" fill="currentColor" />
      <circle cx="15" cy="4.5" r=".6" fill="currentColor" />
    </svg>
  )
}
