/**
 * Cổng thành lớn cho mặt trong nắp: ba tầng mái cong, hàng cột, tường có ba cổng vòm, đồi nét ở chân.
 * Mở rộng từ cổng thành của Logo, nhiều chi tiết hơn. Chỉ nét mảnh theo currentColor.
 */
const COLUMNS_LOW = [72, 104, 136, 168, 200, 232, 264, 296, 328];
const COLUMNS_MID = [136, 168, 200, 232, 264];

export function CitadelPanorama({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 226"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ strokeWidth: 'var(--foil-w, 1.1px)' }}
    >
      <g vectorEffect="non-scaling-stroke">
        {/* Chóp và tầng ba */}
        <path d="M200 32V40M192 40H208" vectorEffect="non-scaling-stroke" />
        <path d="M138 62Q156 60 164 48H236Q244 60 262 62H138" vectorEffect="non-scaling-stroke" />
        <path d="M164 48Q166 44 172 44M236 48Q234 44 228 44" vectorEffect="non-scaling-stroke" />
        <path
          d="M150 62V76H250V62M170 62V76M200 62V76M230 62V76"
          vectorEffect="non-scaling-stroke"
        />
        {/* Tầng hai */}
        <path d="M104 92Q124 90 132 76H268Q276 90 296 92H104" vectorEffect="non-scaling-stroke" />
        <path d="M132 76Q134 72 140 72M268 76Q266 72 260 72" vectorEffect="non-scaling-stroke" />
        <path d="M120 92V108H280V92" vectorEffect="non-scaling-stroke" />
        {COLUMNS_MID.map((x) => (
          <path key={x} d={`M${x} 92V108`} vectorEffect="non-scaling-stroke" opacity="0.7" />
        ))}
        {/* Tầng một */}
        <path d="M52 124Q76 122 84 108H316Q324 122 348 124H52" vectorEffect="non-scaling-stroke" />
        <path d="M84 108Q86 104 92 104M316 108Q314 104 308 104" vectorEffect="non-scaling-stroke" />
        <path d="M52 124Q46 124 43 117M348 124Q354 124 357 117" vectorEffect="non-scaling-stroke" />
        {COLUMNS_LOW.map((x) => (
          <path key={x} d={`M${x} 124V148`} vectorEffect="non-scaling-stroke" opacity="0.7" />
        ))}
        {/* Tường thành và ba cổng vòm */}
        <path d="M40 200V150H360V200M36 146H364" vectorEffect="non-scaling-stroke" />
        <path d="M170 200V172A30 30 0 0 1 230 172V200" vectorEffect="non-scaling-stroke" />
        <path
          d="M177 200V172A23 23 0 0 1 223 172V200"
          vectorEffect="non-scaling-stroke"
          opacity="0.6"
        />
        <path d="M92 200V176A18 18 0 0 1 128 176V200" vectorEffect="non-scaling-stroke" />
        <path d="M272 200V176A18 18 0 0 1 308 176V200" vectorEffect="non-scaling-stroke" />
        {/* Mặt đất và đồi */}
        <path d="M10 200H390" vectorEffect="non-scaling-stroke" />
        <path
          d="M0 214Q60 202 120 211T240 209T400 205"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        />
        <path d="M0 223Q80 214 160 221T400 216" vectorEffect="non-scaling-stroke" opacity="0.45" />
      </g>
    </svg>
  );
}
