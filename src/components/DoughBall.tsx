export function DoughBall({ size = 112 }: { size?: number }) {
  return (
    <svg className="dough-ball" width={size} height={size} viewBox="100 140 312 250" aria-hidden="true">
      <ellipse cx="256" cy="372" rx="148" ry="16" fill="currentColor" opacity=".12" />
      <path d="M118 338C118 228 180 154 256 154S394 228 394 338C394 357 331 368 256 368S118 357 118 338Z" fill="var(--dough)" />
      <path
        d="M118 338C118 357 181 368 256 368S394 357 394 338C394 330 393 322 392 315C380 337 324 347 256 347S132 337 120 315C119 322 118 330 118 338Z"
        fill="var(--dough-shade)"
      />
      <ellipse cx="205" cy="214" rx="38" ry="17" transform="rotate(-32 205 214)" fill="#fff" opacity=".55" />
      <g fill="var(--dough-shade)">
        <circle cx="292" cy="226" r="10" />
        <circle cx="321" cy="282" r="14" />
        <circle cx="214" cy="292" r="9" />
        <circle cx="262" cy="270" r="6" />
        <circle cx="176" cy="262" r="5" />
      </g>
    </svg>
  );
}
