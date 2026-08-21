type BrandMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  inverse?: boolean;
  subtitle?: string;
};

export function BrandMark({ className = "", title }: BrandMarkProps) {
  return (
    <svg
      className={`brand-symbol ${className}`.trim()}
      viewBox="0 0 96 72"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path fill="#132a32" d="M6 43c15-1 29 4 41 20C32 56 19 54 6 55V43Z" />
      <path fill="#132a32" d="M90 43c-15-1-29 4-41 20 15-7 28-9 41-8V43Z" />
      <circle cx="48" cy="13" r="6" fill="#087f75" />
      <path fill="#087f75" d="M42 27a6 6 0 0 1 12 0v20l-6 8-6-8V27Z" />
      <circle cx="28" cy="22" r="5" fill="#e8a33a" />
      <path fill="#e8a33a" d="M24 34a4 4 0 0 1 8 0v13c-3-1-5-2-8-2V34Z" />
      <circle cx="68" cy="22" r="5" fill="#e8a33a" />
      <path fill="#e8a33a" d="M64 34a4 4 0 0 1 8 0v11c-3 0-5 1-8 2V34Z" />
    </svg>
  );
}

export default function BrandLogo({ className = "", inverse = false, subtitle }: BrandLogoProps) {
  return (
    <span className={`brand-identity ${inverse ? "brand-identity-inverse" : ""} ${className}`.trim()}>
      <BrandMark />
      <span className="brand-copy">
        <span className="brand-word"><span className="brand-word-edu">Edu</span><span className="brand-word-bonke">Bonke</span></span>
        {subtitle && <span className="brand-subtitle">{subtitle}</span>}
      </span>
    </span>
  );
}
