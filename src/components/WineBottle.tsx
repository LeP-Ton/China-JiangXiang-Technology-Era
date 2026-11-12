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
  unbranded?: boolean;
}

function ProductInscription({
  product,
  top = 285,
  height = 125,
}: {
  product: string;
  top?: number;
  height?: number;
}) {
  const characters = Array.from(product);
  const columns =
    characters.length <= 4 ? 1 : Math.ceil(characters.length / (characters.length <= 12 ? 4 : 6));
  const rows = Math.ceil(characters.length / columns);
  const columnLengths = Array.from(
    { length: columns },
    (_, column) =>
      Math.floor(characters.length / columns) + (column < characters.length % columns ? 1 : 0),
  );
  let offset = 0;
  const textColumns = columnLengths.map((length) => {
    const letters = characters.slice(offset, offset + length);
    offset += length;
    return letters;
  });
  const baseFontSize =
    characters.length <= 2 ? 44 : characters.length <= 4 ? 34 : characters.length <= 12 ? 27 : 22;
  const rowGap = rows > 4 ? 3 : 5;
  // 按酒标的可用宽高同时约束字号，长名称分列且保留字间留白。
  const fontSize = Math.min(
    baseFontSize,
    (82 - (columns - 1) * 4) / columns,
    (height - (rows - 1) * rowGap) / rows,
  );
  const lineHeight = fontSize + rowGap;
  const columnWidth = fontSize + 4;
  return (
    <g className="bottle-product-inscription" aria-hidden="true">
      {textColumns.map((letters, column) => {
        const x = 150 + ((columns - 1) / 2 - column) * columnWidth;
        const blockHeight = letters.length * fontSize + (letters.length - 1) * rowGap;
        const start = top + (height - blockHeight) / 2 + fontSize;
        return (
          <g key={column}>
            {letters.map((character, row) => (
              <text
                key={row}
                x={x}
                y={start + row * lineHeight}
                fontSize={fontSize}
                textAnchor="middle"
              >
                {character}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

function BrandSignature({ brand, bottom = 275 }: { brand: string; bottom?: number }) {
  const characters = Array.from(brand);
  const perLine = characters.length <= 12 ? 6 : 10;
  const fontSize =
    characters.length <= 2
      ? 16
      : characters.length <= 4
        ? 14
        : characters.length <= 6
          ? 12
          : characters.length <= 12
            ? 10
            : 8;
  const lines: string[] = [];
  for (let i = 0; i < characters.length; i += perLine)
    lines.push(characters.slice(i, i + perLine).join(''));
  return (
    <g className="bottle-brand-inscription" aria-hidden="true">
      {lines.map((line, index) => (
        <text
          key={index}
          x="150"
          y={bottom - (lines.length - 1 - index) * (fontSize + 2)}
          fontSize={fontSize}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function BottleEmblem({ logo }: { logo: string }) {
  return isUploadedLogo(logo) ? (
    <image href={logo} width="64" height="64" preserveAspectRatio="xMidYMid meet" />
  ) : (
    <EmblemArtwork logo={logo} />
  );
}

function SimpleBottle({
  id,
  brand,
  product,
  company,
  logo,
  className,
  unbranded,
}: WineBottleProps & { id: string }) {
  const fill = (name: string) => `url(#${id}-${name})`;
  const outline =
    'M128 96H172V174C172 187 181 199 197 218C207 230 213 241 213 258V493Q213 515 193 518H107Q87 515 87 493V258C87 241 93 230 103 218C119 199 128 187 128 174Z';
  return (
    <svg
      className={`crafted-bottle bottle-simple ${className ?? ''}`}
      viewBox="0 0 300 560"
      role="img"
      aria-label={
        unbranded
          ? `${company}企业形象示意酒瓶，品牌与产品尚未创建`
          : `${brand} · ${product} · 简装包装酒瓶`
      }
      data-brand={unbranded ? '' : brand}
      data-product={unbranded ? '' : product}
      data-packaging="简装"
    >
      <title>{unbranded ? `${company}企业形象示意` : `${brand} · ${product}`}</title>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop stopColor="#9aafaa" stopOpacity=".75" />
          <stop offset=".07" stopColor="#e6f0ec" stopOpacity=".9" />
          <stop offset=".19" stopColor="#fff" stopOpacity=".72" />
          <stop offset=".42" stopColor="#e9eeeb" stopOpacity=".24" />
          <stop offset=".78" stopColor="#c4d6cf" stopOpacity=".36" />
          <stop offset=".96" stopColor="#7d9890" stopOpacity=".7" />
          <stop offset="1" stopColor="#d4e3dd" stopOpacity=".8" />
        </linearGradient>
        <linearGradient id={`${id}-spirit`} x1="0" x2="1">
          <stop stopColor="#c6c5a9" stopOpacity=".5" />
          <stop offset=".3" stopColor="#fffef0" stopOpacity=".58" />
          <stop offset=".7" stopColor="#f4edcf" stopOpacity=".38" />
          <stop offset="1" stopColor="#c3c9b5" stopOpacity=".66" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" x2="1">
          <stop stopColor="#6d7776" />
          <stop offset=".16" stopColor="#d0d8d5" />
          <stop offset=".33" stopColor="#f6f8f6" />
          <stop offset=".56" stopColor="#c4ceca" />
          <stop offset=".91" stopColor="#7c8883" />
          <stop offset="1" stopColor="#b9c5bf" />
        </linearGradient>
        <linearGradient id={`${id}-plain-paper`} x1="0" x2="1">
          <stop stopColor="#e8e4d8" />
          <stop offset=".35" stopColor="#fffdf5" />
          <stop offset="1" stopColor="#ece8dc" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#25372f" stopOpacity=".25" />
          <stop offset="1" stopColor="#25372f" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-screw-ribs`} width="3" height="8" patternUnits="userSpaceOnUse">
          <path d="M.5 0v8" stroke="#fff" strokeOpacity=".5" strokeWidth=".6" />
          <path d="M2 0v8" stroke="#52615b" strokeOpacity=".25" strokeWidth=".5" />
        </pattern>
        <clipPath id={`${id}-glass-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <ellipse cx="150" cy="529" rx="92" ry="14" fill={fill('shadow')} />
      <path d={outline} fill={fill('glass')} stroke="#9cad9f" strokeWidth="1" />
      <g clipPath={fill('glass-clip')}>
        <path d="M91 246Q150 251 209 246V506H91Z" fill={fill('spirit')} />
        <path d="M92 247Q150 252 208 247" fill="none" stroke="#bfcbb8" strokeWidth="1.1" />
        <path
          d="M132 115V176Q132 190 112 219Q97 237 97 258V492"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeOpacity=".8"
          strokeLinecap="round"
        />
        <path
          d="M141 120V171M105 256V386"
          fill="none"
          stroke="#fff"
          strokeWidth="1.3"
          strokeOpacity=".8"
        />
        <path d="M201 259V491" fill="none" stroke="#617c6d" strokeWidth="2" strokeOpacity=".22" />
        <path
          d="M98 501Q150 483 202 501M100 507H200"
          fill="none"
          stroke="#8ca495"
          strokeWidth="1.7"
          strokeOpacity=".5"
        />
        <rect
          x="98"
          y="258"
          width="104"
          height="218"
          rx="1.5"
          fill={fill('plain-paper')}
          stroke="#c4c4b5"
          strokeWidth=".65"
        />
        <path d="M99 285H201M99 288H201" stroke="#a14638" strokeWidth="1.1" />
        <g
          className="bottle-emblem"
          transform={unbranded ? 'translate(127 337) scale(.72)' : 'translate(141 262) scale(.28)'}
        >
          <BottleEmblem logo={logo} />
        </g>
        {unbranded ? (
          <text x="150" y="427" textAnchor="middle" fontSize="11" className="bottle-category">
            品牌与产品待创立
          </text>
        ) : (
          <>
            <BrandSignature brand={brand} bottom={319} />
            <ProductInscription product={product} top={323} height={112} />
          </>
        )}
        <path d="M127 443h46" stroke="#b0b5a3" strokeWidth=".6" />
        <text
          x="150"
          y="460"
          textAnchor="middle"
          fontSize="6"
          letterSpacing="1.2"
          className="bottle-category"
        >
          酱香型白酒 · 500 mL
        </text>
        <text
          x="150"
          y="482"
          textAnchor="middle"
          fontSize="5.4"
          textLength={Math.min(100, Math.max(30, company.length * 5.5))}
          lengthAdjust="spacingAndGlyphs"
          className="bottle-maker"
        >
          {company.trim() || '待命名酒业'}
        </text>
      </g>
      <rect x="125" y="105" width="50" height="15" rx="1" fill="#9b4438" />
      <path d="M127 112H173" stroke="#e1ad97" strokeWidth=".7" />
      <rect
        x="122"
        y="66"
        width="56"
        height="40"
        rx="3"
        fill={fill('silver')}
        stroke="#7f8a84"
        strokeWidth=".8"
      />
      <rect x="123" y="70" width="54" height="29" rx="2" fill={fill('screw-ribs')} />
      <ellipse cx="150" cy="67" rx="27" ry="3" fill="#dbe2dc" stroke="#87968b" strokeWidth=".7" />
      <path d="M123 101H177" stroke="#596b5e" strokeWidth="1.3" />
    </svg>
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
  unbranded = false,
}: WineBottleProps) {
  const id = `wine-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const fill = (name: string) => `url(#${id}-${name})`;
  const displayBrand = brand.trim() || '待命名品牌';
  const displayProduct = product.trim() || '待命名产品';
  const collectible = packaging === '典藏';
  if (packaging === '简装')
    return (
      <SimpleBottle
        id={id}
        brand={displayBrand}
        product={displayProduct}
        company={company}
        logo={logo}
        className={className}
        unbranded={unbranded}
      />
    );
  const outline =
    'M112 121H188V162C188 180 210 180 220 207C227 228 226 263 226 290L224 481C224 510 202 528 150 529C98 528 76 510 76 481L74 290C74 263 73 228 80 207C90 180 112 180 112 162Z';
  return (
    <svg
      className={`crafted-bottle ${collectible ? 'bottle-collectible' : 'bottle-elegant'} ${className}`}
      viewBox="0 0 300 560"
      role="img"
      aria-label={
        unbranded
          ? `${company}企业形象示意酒瓶，品牌与产品尚未创建`
          : `${displayBrand} · ${displayProduct} · ${packaging}包装酒瓶`
      }
      data-brand={unbranded ? '' : displayBrand}
      data-product={unbranded ? '' : displayProduct}
      data-packaging={packaging}
    >
      <title>{unbranded ? `${company}企业形象示意` : `${displayBrand} · ${displayProduct}`}</title>
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
        <path
          d="M100 218q50-11 100 0v226q-50 15-100 0Z"
          fill="none"
          stroke={collectible ? '#b7a16c' : '#c8bb90'}
          strokeOpacity=".5"
          strokeWidth=".6"
        />
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
        <g
          className="bottle-emblem"
          transform={unbranded ? 'translate(125 284) scale(.78)' : 'translate(138 226) scale(.375)'}
        >
          <BottleEmblem logo={logo} />
        </g>
        {unbranded ? (
          <g className="bottle-category" textAnchor="middle" fontSize="11">
            <text x="150" y="414">
              品牌待创立
            </text>
            <text x="150" y="430">
              产品待研发
            </text>
          </g>
        ) : (
          <>
            <BrandSignature brand={displayBrand} />
            <ProductInscription product={displayProduct} />
            <path d="M126 423h48" stroke="currentColor" className="bottle-foil" strokeWidth=".55" />
          </>
        )}
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
