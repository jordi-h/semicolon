/** Facebook's "f" mark. Always rendered in Facebook's brand blue per their
 * guidelines, unlike GitHub's monochrome logo. */
export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.66 18.63.5 12 .5S0 5.66 0 12.07c0 5.8 4.39 10.61 10.13 11.43v-8.09H7.08v-3.34h3.05V9.41c0-3 1.83-4.66 4.6-4.66 1.33 0 2.72.23 2.72.23v2.96h-1.53c-1.51 0-1.98.93-1.98 1.88v2.25h3.37l-.54 3.34h-2.83v8.09C19.61 22.68 24 17.87 24 12.07Z"
      />
    </svg>
  )
}
