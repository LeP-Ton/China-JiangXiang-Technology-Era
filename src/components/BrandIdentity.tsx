export const COMPANY_EMBLEMS = [
  { value: '山', name: '远山', detail: '山水相依，历久成香' },
  { value: '酱', name: '酿印', detail: '一方酿印，守住本味' },
  { value: '谷', name: '金穗', detail: '以粮为本，向新而生' },
  { value: '醴', name: '醴泉', detail: '一脉清泉，酿成佳醴' },
] as const;

export const isUploadedLogo = (logo: string) => /^data:image\/(png|jpeg|webp);base64,/i.test(logo);

// 同一套矢量构形用于企业门楣、标识选择和瓶身烫印，保证识别一致。
export function EmblemArtwork({ logo }: { logo: string }) {
  const shape = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.45,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <g {...shape}>
      <path d="M32 3.5 57 17.8v28.4L32 60.5 7 46.2V17.8Z" opacity=".76" />
      <path d="M32 8 53 20v24L32 56 11 44V20Z" opacity=".25" strokeWidth=".8" />
      {logo === '谷' ? (
        <>
          <path d="M32 46V19M32 39C20 36 17 30 17 25c10 0 15 6 15 14ZM32 39c12-3 15-9 15-14-10 0-15 6-15 14Z" />
          <path d="M32 31c-7-2-10-7-10-12 7 0 10 6 10 12Zm0 0c7-2 10-7 10-12-7 0-10 6-10 12Z" />
          <path d="m21 43 11 6 11-6M32 12v3" />
          <path d="m15 31 3 2m31-2-3 2" opacity=".5" />
        </>
      ) : logo === '酱' ? (
        <>
          <path d="M24 17h16M27 17v6l-8 9v11c0 5 26 5 26 0V32l-8-9v-6M19 33h26M20 39h24M26 48v3m12-3v3" />
          <path d="M27 29h10M28 21h8M32 34v5M15 24l3 3m31-3-3 3" opacity=".6" />
          <path d="M28 12h8" strokeWidth="2.4" />
        </>
      ) : logo === '醴' ? (
        <>
          <path d="M32 14c-3 8-12 14-12 23 0 15 24 15 24 0 0-9-9-15-12-23Z" />
          <path d="M26 27c-6 10-2 15 3 16M19 39c8-5 18-5 26 0M26 51h12" />
          <circle cx="32" cy="30" r="2" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <path d="m15 37 11-17 9 13 6-9 9 13M20 37l6-10 6 10M16 42c7-3 11-3 16 0s10 3 16 0M22 47c7-2 13 4 20 0" />
          <circle cx="39" cy="18" r="3" strokeWidth="1.1" />
          <path d="m25 22 3 8m13-4-2 7" opacity=".4" />
        </>
      )}
      <circle cx="32" cy="54" r=".8" fill="currentColor" stroke="none" />
    </g>
  );
}

export function CompanyMark({
  logo,
  name = '企业',
  className = '',
}: {
  logo: string;
  name?: string;
  className?: string;
}) {
  const uploaded = isUploadedLogo(logo);
  return (
    <span
      className={`corporate-mark ${className} ${uploaded ? 'custom-mark' : ''}`}
      role="img"
      aria-label={`${name}企业标识`}
      data-emblem={uploaded ? 'custom' : logo}
    >
      {uploaded ? (
        <img src={logo} alt="" />
      ) : (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <EmblemArtwork logo={logo} />
        </svg>
      )}
    </span>
  );
}

export function CompanyIdentity({
  name,
  logo,
  variant = 'masthead',
}: {
  name: string;
  logo: string;
  variant?: 'masthead' | 'sidebar';
}) {
  const displayName = name.trim() || '待命名酒业';
  return (
    <div className={`corporate-identity identity-${variant}`} aria-label={`${displayName}企业门楣`}>
      <CompanyMark logo={logo} name={displayName} />
      <div className="corporate-wordmark">
        <strong className={displayName.length > 12 ? 'long-company-name' : ''} title={displayName}>
          {displayName}
        </strong>
        <span className="corporate-rule">
          <i />
          精酿于心 · 成香于时
          <i />
        </span>
        <small>JIANGXIANG DISTILLERY</small>
      </div>
    </div>
  );
}
