import { useId } from 'react';
import { EmblemArtwork, isUploadedLogo } from './BrandIdentity';
import type { Recipe } from '../game/types';

interface WineBottleProps {
  brand: string;
  product: string;
  company: string;
  logo: string;
  packaging?: Recipe['packaging'];
  className?: string;
}

function BrandInscription({ brand }: { brand: string }) {
  const characters = Array.from(brand);
  const rows = characters.length <= 4 ? characters.length : characters.length <= 12 ? 4 : 6;
  const columns = Math.ceil(characters.length / rows);
  const baseFontSize =
    characters.length <= 2 ? 44 : characters.length <= 4 ? 34 : characters.length <= 12 ? 27 : 22;
  const fontSize =
    columns === 1 ? baseFontSize : Math.min(baseFontSize, (82 - (columns - 1) * 3) / columns);
  const lineHeight = Math.min(44, 126 / rows);
  const columnWidth = fontSize + 3;
  const top = 275 + Math.max(0, (4 - rows) * 9);
  return (
    <g className="bottle-brand-inscription" aria-hidden="true">
      {characters.map((character, index) => {
        const column = Math.floor(index / rows);
        const x = 150 + ((columns - 1) / 2 - column) * columnWidth;
        const y = top + (index % rows) * lineHeight;
        return (
          <text key={index} x={x} y={y} fontSize={fontSize} textAnchor="middle">
            {character}
          </text>
        );
      })}
    </g>
  );
}

// 酒瓶形体与实时排字分层，修改品牌名或企业标识无需替换静态图片。
export default function WineBottle({
  brand,
  product,
  company,
  logo,
  packaging = '雅致',
  className = '',
}: WineBottleProps) {
  const id = `wine-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const fill = (name: string) => `url(#${id}-${name})`;
  const displayBrand = brand.trim() || '待命名';
  const displayProduct = product.trim() || '品牌首酿';
  const collectible = packaging === '典藏';
  const simple = packaging === '简装';
  const outline =
    'M112 121H188V162C188 180 210 180 220 207C227 228 226 263 226 290L224 481C224 510 202 528 150 529C98 528 76 510 76 481L74 290C74 263 73 228 80 207C90 180 112 180 112 162Z';
  const productLines = Array.from(displayProduct).reduce<string[]>((lines, character, i) => {
    const row = Math.floor(i / 14);
    lines[row] = (lines[row] || '') + character;
    return lines;
  }, []);
  return (
    <svg
      className={`crafted-bottle ${collectible ? 'bottle-collectible' : simple ? 'bottle-simple' : 'bottle-elegant'} ${className}`}
      viewBox="0 0 300 560"
      role="img"
      aria-label={`${displayBrand} · ${displayProduct} · ${packaging}包装酒瓶`}
      data-brand={displayBrand}
      data-packaging={packaging}
    >
      <title>
        {displayBrand} · {displayProduct}
      </title>
      <defs>
        <linearGradient id={`${id}-ceramic`} x1="0" x2="1">
          {collectible ? (
            <>
              <stop offset="0" stopColor="#092b25" />
              <stop offset=".12" stopColor="#225247" />
              <stop offset=".3" stopColor="#3f6a5c" />
              <stop offset=".46" stopColor="#214c40" />
              <stop offset=".74" stopColor="#153e33" />
              <stop offset=".94" stopColor="#082b22" />
              <stop offset="1" stopColor="#1e4638" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#c9c2a8" />
              <stop offset=".06" stopColor="#e0dbc7" />
              <stop offset=".18" stopColor="#f2efdf" />
              <stop offset=".38" stopColor="#fffdf2" />
              <stop offset=".6" stopColor="#f6f2e1" />
              <stop offset=".85" stopColor="#e3dcc4" />
              <stop offset=".97" stopColor="#c6bea3" />
              <stop offset="1" stopColor="#ddd5bc" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="1">
          <stop offset="0" stopColor="#76633e" />
          <stop offset=".07" stopColor="#b6a16b" />
          <stop offset=".19" stopColor="#e9d9a8" />
          <stop offset=".32" stopColor="#c9b379" />
          <stop offset=".5" stopColor="#dfca95" />
          <stop offset=".77" stopColor="#b39a61" />
          <stop offset=".93" stopColor="#7e6c42" />
          <stop offset="1" stopColor="#a18a54" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={collectible ? '#234b3e' : '#f7f1dd'} />
          <stop offset=".5" stopColor={collectible ? '#173b31' : '#fffaeb'} />
          <stop offset="1" stopColor={collectible ? '#0e3027' : '#e9dfbf'} />
        </linearGradient>
        <linearGradient id={`${id}-toplight`} x1="0" x2=".3" y1="0" y2="1">
          <stop stopColor="#fff" stopOpacity=".5" />
          <stop offset=".48" stopColor="#fff" stopOpacity=".03" />
          <stop offset="1" stopColor="#756d4e" stopOpacity=".16" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#1c3022" stopOpacity=".32" />
          <stop offset="1" stopColor="#1c3022" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shoulder`} cx=".25" cy=".12" r=".95">
          <stop stopColor="#fff" stopOpacity={collectible ? '.18' : '.75'} />
          <stop offset=".58" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-cap-ribs`} width="3" height="8" patternUnits="userSpaceOnUse">
          <path d="M.5 0v8" stroke="#fff7d5" strokeOpacity=".22" strokeWidth=".55" />
          <path d="M2 0v8" stroke="#68512b" strokeOpacity=".19" strokeWidth=".5" />
        </pattern>
        <pattern id={`${id}-paper`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="m0 2 4 .6M2 5l3-1"
            stroke={collectible ? '#b9a36c' : '#a28b4e'}
            strokeWidth=".3"
            opacity=".17"
          />
        </pattern>
        <clipPath id={`${id}-bottle-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <ellipse cx="151" cy="537" rx="112" ry="17" fill={fill('shadow')} />
      <ellipse cx="151" cy="535" rx="63" ry="6" fill="#273526" opacity=".12" />
      <path
        d={outline}
        fill={fill('ceramic')}
        stroke={collectible ? '#0b2c24' : '#bcb59b'}
        strokeWidth=".9"
      />
      <g clipPath={fill('bottle-clip')}>
        <path d={outline} fill={fill('toplight')} />
        <ellipse cx="124" cy="199" rx="94" ry="80" fill={fill('shoulder')} />
        <path
          d="M91 220c-7 53-4 214-2 260"
          stroke="#fff"
          strokeOpacity={collectible ? '.2' : '.7'}
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M98 231c-3 41-2 92-1 118"
          stroke="#fff"
          strokeOpacity=".35"
          strokeWidth="1.1"
          fill="none"
        />
        <path
          d="M215 239c3 61 0 211-3 246"
          stroke="#675e3f"
          strokeOpacity=".12"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M80 488c21 16 115 19 141 0"
          fill="none"
          stroke={collectible ? '#769581' : '#c4bba0'}
          strokeWidth="1.3"
          opacity=".6"
        />
        <path
          d="M86 504c35 12 96 12 128-1"
          fill="none"
          stroke="#fff"
          strokeOpacity=".36"
          strokeWidth="2"
        />
        {!simple && (
          <path
            d="M100 218q50-11 100 0v226q-50 15-100 0Z"
            fill="none"
            stroke={collectible ? '#b7a16c' : '#c8bb90'}
            strokeOpacity=".5"
            strokeWidth=".6"
          />
        )}
        <path
          d="M103 223q47-10 94 0v216q-47 14-94 0Z"
          fill={fill('label')}
          stroke={collectible ? '#ab935b' : '#c7b98c'}
          strokeWidth=".55"
        />
        <path d="M103 223q47-10 94 0v216q-47 14-94 0Z" fill={fill('paper')} />
        <path
          d="M108 227q42-8 84 0v208q-42 12-84 0Z"
          fill="none"
          stroke={collectible ? '#b5a276' : '#d5c89f'}
          strokeWidth=".45"
        />
        <g className="bottle-emblem" transform="translate(138 226) scale(.375)">
          {isUploadedLogo(logo) ? (
            <image href={logo} width="64" height="64" preserveAspectRatio="xMidYMid meet" />
          ) : (
            <EmblemArtwork logo={logo} />
          )}
        </g>
        <BrandInscription brand={displayBrand} />
        <path d="M126 402h48" stroke="currentColor" className="bottle-foil" strokeWidth=".55" />
        {productLines.map((line, index) => (
          <text
            key={index}
            x="150"
            y={416 + index * 10}
            textAnchor="middle"
            fontSize={productLines.length > 1 ? 6.6 : 8}
            className="bottle-product-inscription"
          >
            {line}
          </text>
        ))}
        <text
          x="150"
          y="457"
          textAnchor="middle"
          fontSize="6.3"
          letterSpacing="2.5"
          className="bottle-category"
        >
          酱香型白酒
        </text>
        <text
          x="150"
          y="470"
          textAnchor="middle"
          fontSize="5.6"
          letterSpacing="1.8"
          className="bottle-category"
        >
          固态发酵 · 500 mL
        </text>
        <text
          x="150"
          y="492"
          textAnchor="middle"
          fontSize="5.4"
          textLength={Math.min(119, Math.max(30, company.length * 5.5))}
          lengthAdjust="spacingAndGlyphs"
          className="bottle-maker"
        >
          {company.trim() || '待命名酒业'}
        </text>
      </g>
      <rect
        x="109"
        y="112"
        width="82"
        height="38"
        rx="4"
        fill={fill('metal')}
        stroke="#9d8753"
        strokeWidth=".7"
      />
      <rect x="109" y="119" width="82" height="6" fill="#e7d4a0" opacity=".55" />
      <path d="M110 146h80" stroke="#725c32" strokeWidth="1" opacity=".6" />
      <text x="150" y="139" textAnchor="middle" fontSize="5.4" letterSpacing="1.6" fill="#6b582f">
        JIANGXIANG
      </text>
      <path
        d="M104 53q46-6 92 0v62q-46 4-92 0Z"
        fill={fill('metal')}
        stroke="#8f7b4b"
        strokeWidth=".9"
      />
      <path d="M104 57q46-5 92 0v54q-46 4-92 0Z" fill={fill('cap-ribs')} />
      <ellipse cx="150" cy="53" rx="46" ry="5" fill="#ccb884" stroke="#a58e57" strokeWidth=".7" />
      <ellipse cx="150" cy="52" rx="39" ry="2.3" fill="#ecdbaa" opacity=".5" />
      <path
        d="M105 63q45-4 90 0M105 105q45 4 90 0"
        stroke="#f7e9bd"
        strokeWidth=".7"
        opacity=".6"
        fill="none"
      />
      <path d="M106 111q44 4 88 0" stroke="#796338" strokeWidth="1.4" opacity=".7" fill="none" />
      <path d="M116 61v42" stroke="#fff5ca" strokeWidth="3" opacity=".19" />
    </svg>
  );
}
