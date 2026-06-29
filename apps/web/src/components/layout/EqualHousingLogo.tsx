/** Equal Housing Opportunity mark — simplified house + equals, inline so we ship no binary asset. */
export function EqualHousingLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Equal Housing Opportunity"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 7 6 21h5v18h26V21h5L24 7Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="18" y="26" width="12" height="3" fill="currentColor" />
      <rect x="18" y="32" width="12" height="3" fill="currentColor" />
    </svg>
  );
}
