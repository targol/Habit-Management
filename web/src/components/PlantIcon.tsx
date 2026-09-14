import React from 'react';

export interface PlantTypeOption {
  id: string;
  name: string;
  description: string;
}

export const ALL_PLANT_TYPES: PlantTypeOption[] = [
  { id: 'برگ انجیری', name: 'برگ انجیری (مونسترا)', description: 'نماد پشتکار، برگ‌های پهن و طراوت سبز' },
  { id: 'بونسای', name: 'بونسای خردمند', description: 'نماد صبر، مهارت، تسلط و آرامش پایدار' },
  { id: 'کاکتوس گلدار', name: 'کاکتوس گلدار', description: 'نماد سرسختی، مقاومت و امید در شرایط سخت' },
  { id: 'نیلوفر آبی', name: 'نیلوفر آبی صورتی', description: 'نماد پاکی، تمرکز، صلح درونی و زیبایی' },
  { id: 'آفتابگردان', name: 'آفتابگردان شاداب', description: 'نماد شادابی، انگیزه، وفاداری و انرژی مثبت' },
  { id: 'گل سرخ', name: 'گل سرخ / رز', description: 'نماد شکوه، عشق به کار، شور و تعهد عمیق' },
  { id: 'بامبو شانس', name: 'بامبو شانس و ثروت', description: 'نماد انعطاف، رشد سریع و خیر و برکت' },
  { id: 'پیچک رونده', name: 'پیچک رونده سبز', description: 'نماد پیوستگی زنجیره و بالا رفتن مداوم' },
  { id: 'ریحان و نعنا', name: 'ریحان و نعنای معطر', description: 'نماد طراوت ذهن و سلامتی پایدار روزانه' },
];

interface Props {
  type?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export const PlantIcon: React.FC<Props> = ({
  type = 'برگ انجیری',
  size = 'md',
  className = '',
  animated = false,
}) => {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const animClass = animated ? 'animate-bounce-subtle' : '';

  // Render cute custom SVG per plant type
  const renderSVG = () => {
    switch (type) {
      case 'برگ انجیری':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Cute terra-cotta pot */}
            <path d="M22 46 L24 58 Q24 60 27 60 L37 60 Q40 60 40 58 L42 46 Z" fill="#E07A5F" />
            <rect x="20" y="43" width="24" height="4" rx="2" fill="#D35400" />
            {/* Plant Stems */}
            <path d="M32 44 Q31 30 25 20" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 44 Q35 28 42 22" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 44 Q32 22 32 14" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" />
            {/* Monstera Leaf Left */}
            <path d="M24 20 C14 18 12 30 22 34 C25 35 27 32 27 28 C26 23 25 21 24 20 Z" fill="#52B788" />
            <circle cx="19" cy="27" r="1.5" fill="#E07A5F" opacity="0.3" />
            {/* Monstera Leaf Right */}
            <path d="M42 22 C52 20 54 32 44 36 C41 37 39 34 39 30 C40 25 41 23 42 22 Z" fill="#40916C" />
            <circle cx="47" cy="29" r="1.5" fill="#E07A5F" opacity="0.3" />
            {/* Main Center Leaf */}
            <path d="M32 12 C24 8 20 18 28 26 C31 29 34 29 36 26 C44 18 40 8 32 12 Z" fill="#74C69D" />
            <ellipse cx="32" cy="18" rx="1.5" ry="3" fill="#D8F3DC" opacity="0.8" />
            {/* Cute blush on pot */}
            <circle cx="27" cy="52" r="1.5" fill="#FFCCD5" />
            <circle cx="37" cy="52" r="1.5" fill="#FFCCD5" />
            {/* Pot cute smile */}
            <path d="M30 54 Q32 56 34 54" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'بونسای':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Ceramic Shallow Bonsai Dish */}
            <ellipse cx="32" cy="56" rx="22" ry="5" fill="#4A5568" />
            <ellipse cx="32" cy="55" rx="20" ry="3.5" fill="#718096" />
            <ellipse cx="32" cy="54" rx="17" ry="2" fill="#5D4037" />
            {/* Twisted Trunk */}
            <path d="M32 54 Q36 44 28 36 Q22 30 26 24 Q30 18 34 16" stroke="#8D6E63" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M28 36 Q38 32 44 30" stroke="#8D6E63" strokeWidth="3" strokeLinecap="round" />
            {/* Foliage Cloud Left */}
            <circle cx="22" cy="24" r="7" fill="#2E7D32" />
            <circle cx="28" cy="21" r="8" fill="#388E3C" />
            <circle cx="20" cy="20" r="6" fill="#4CAF50" />
            {/* Foliage Cloud Right */}
            <circle cx="45" cy="29" r="6.5" fill="#2E7D32" />
            <circle cx="40" cy="26" r="6" fill="#4CAF50" />
            {/* Top Foliage Crown */}
            <circle cx="34" cy="14" r="8" fill="#2E7D32" />
            <circle cx="39" cy="12" r="7" fill="#43A047" />
            <circle cx="30" cy="11" r="6.5" fill="#66BB6A" />
            <circle cx="35" cy="9" r="5" fill="#81C784" />
          </svg>
        );

      case 'کاکتوس گلدار':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Cute Pastel Yellow/Orange Pot */}
            <path d="M22 44 L24 58 Q24 60 27 60 L37 60 Q40 60 40 58 L42 44 Z" fill="#F4A261" />
            <rect x="20" y="41" width="24" height="4" rx="2" fill="#E76F51" />
            {/* Cactus Main Body */}
            <path d="M25 44 C25 24 39 24 39 44 Z" fill="#2A9D8F" />
            {/* Cactus Left Arm */}
            <path d="M25 36 Q17 36 17 28 Q17 24 21 24 Q24 24 24 28 L24 38" fill="#264653" />
            {/* Cactus Right Arm */}
            <path d="M39 34 Q47 34 47 26 Q47 22 43 22 Q40 22 40 26 L40 37" fill="#264653" />
            {/* Spines / dots */}
            <circle cx="32" cy="30" r="0.8" fill="#E9C46A" />
            <circle cx="29" cy="36" r="0.8" fill="#E9C46A" />
            <circle cx="35" cy="36" r="0.8" fill="#E9C46A" />
            <circle cx="32" cy="41" r="0.8" fill="#E9C46A" />
            {/* Pink Blossom on Top */}
            <circle cx="32" cy="20" r="3.5" fill="#E76F51" />
            <circle cx="30" cy="18" r="2.5" fill="#F4A261" />
            <circle cx="34" cy="18" r="2.5" fill="#E63946" />
            <circle cx="32" cy="16" r="2.5" fill="#F72585" />
            <circle cx="32" cy="19" r="1.5" fill="#FFE3E0" />
            {/* Cute smile on pot */}
            <circle cx="28" cy="51" r="1.2" fill="#264653" />
            <circle cx="36" cy="51" r="1.2" fill="#264653" />
            <path d="M30 54 Q32 56 34 54" stroke="#264653" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        );

      case 'نیلوفر آبی':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Water ripples & Lily pad */}
            <ellipse cx="32" cy="52" rx="25" ry="6" fill="#A8DADC" opacity="0.6" />
            <path d="M12 50 C12 43 52 43 52 50 C52 56 36 57 32 50 C28 57 12 56 12 50 Z" fill="#2A9D8F" />
            <ellipse cx="32" cy="50" rx="19" ry="4" fill="#38B000" />
            {/* Water lily outer petals */}
            <path d="M18 44 C22 34 29 44 29 44 Z" fill="#F72585" opacity="0.8" />
            <path d="M46 44 C42 34 35 44 35 44 Z" fill="#F72585" opacity="0.8" />
            <path d="M23 44 C28 28 36 44 36 44 Z" fill="#FF70A6" />
            <path d="M41 44 C36 28 28 44 28 44 Z" fill="#FF70A6" />
            {/* Center petals */}
            <path d="M32 44 C28 24 36 24 32 44 Z" fill="#FF97B7" />
            <path d="M32 44 C30 20 34 20 32 44 Z" fill="#FFD6E0" />
            {/* Golden Core */}
            <circle cx="32" cy="38" r="3.5" fill="#FFB703" />
            <circle cx="32" cy="38" r="2" fill="#FB8500" />
          </svg>
        );

      case 'آفتابگردان':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Stalk and green pot */}
            <path d="M24 46 L26 58 Q26 60 28 60 L36 60 Q38 60 38 58 L40 46 Z" fill="#606C38" />
            <rect x="22" y="44" width="20" height="3" rx="1.5" fill="#283618" />
            <path d="M32 45 L32 26" stroke="#588157" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 38 Q22 36 24 32" stroke="#588157" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 34 Q42 32 40 28" stroke="#588157" strokeWidth="2.5" strokeLinecap="round" />
            {/* Sunflower Golden Petals */}
            <circle cx="32" cy="22" r="16" fill="#FFB703" />
            <circle cx="32" cy="22" r="14" fill="#FCA311" />
            {/* Flower Center */}
            <circle cx="32" cy="22" r="8.5" fill="#6F4E37" />
            <circle cx="32" cy="22" r="6.5" fill="#4A3525" />
            {/* Center pattern */}
            <circle cx="30" cy="21" r="1" fill="#DDA15E" />
            <circle cx="34" cy="21" r="1" fill="#DDA15E" />
            <circle cx="32" cy="24" r="1" fill="#DDA15E" />
          </svg>
        );

      case 'گل سرخ':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Ceramic Pot */}
            <path d="M23 46 L25 58 Q25 60 28 60 L36 60 Q39 60 39 58 L41 46 Z" fill="#BC6C25" />
            <rect x="21" y="43" width="22" height="4" rx="2" fill="#9A5216" />
            {/* Stem with cute leaves */}
            <path d="M32 44 Q31 34 32 26" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 38 C25 35 24 41 32 40" fill="#52B788" />
            <path d="M32 34 C39 31 40 37 32 36" fill="#40916C" />
            {/* Rose Blossom Petals */}
            <circle cx="32" cy="21" r="12" fill="#D90429" />
            <circle cx="30" cy="20" r="9" fill="#EF233C" />
            <circle cx="34" cy="20" r="7.5" fill="#E63946" />
            <circle cx="32" cy="19" r="6" fill="#FF4D6D" />
            <circle cx="32" cy="18" r="3.5" fill="#FF758F" />
            <path d="M31 18 Q32 16 33 18" stroke="#FFF" strokeWidth="1" strokeLinecap="round" />
          </svg>
        );

      case 'بامبو شانس':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Glass vase with water and pebbles */}
            <rect x="22" y="42" width="20" height="18" rx="3" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
            <ellipse cx="32" cy="56" rx="8" ry="2.5" fill="#94A3B8" />
            <ellipse cx="27" cy="55" rx="3" ry="2" fill="#CBD5E1" />
            <ellipse cx="37" cy="55" rx="3" ry="2" fill="#CBD5E1" />
            {/* Bamboo Stalk 1 */}
            <rect x="25" y="20" width="4" height="26" rx="1.5" fill="#22C55E" />
            <line x1="24" y1="28" x2="30" y2="28" stroke="#15803D" strokeWidth="1.5" />
            <line x1="24" y1="36" x2="30" y2="36" stroke="#15803D" strokeWidth="1.5" />
            {/* Bamboo Stalk 2 (Taller center) */}
            <rect x="30" y="12" width="4" height="34" rx="1.5" fill="#4ADE80" />
            <line x1="29" y1="20" x2="35" y2="20" stroke="#16A34A" strokeWidth="1.5" />
            <line x1="29" y1="30" x2="35" y2="30" stroke="#16A34A" strokeWidth="1.5" />
            {/* Bamboo Stalk 3 */}
            <rect x="35" y="16" width="4" height="30" rx="1.5" fill="#16A34A" />
            <line x1="34" y1="24" x2="40" y2="24" stroke="#15803D" strokeWidth="1.5" />
            <line x1="34" y1="33" x2="40" y2="33" stroke="#15803D" strokeWidth="1.5" />
            {/* Cute leafy sprouts on tips */}
            <path d="M26 18 Q20 16 22 12" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 10 Q32 4 36 6" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
            <path d="M37 14 Q44 12 42 8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'پیچک رونده':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Hanging Basket / pot */}
            <path d="M20 38 L24 50 Q24 52 27 52 L37 52 Q40 52 40 50 L44 38 Z" fill="#78350F" />
            <line x1="22" y1="38" x2="32" y2="12" stroke="#D97706" strokeWidth="1.2" />
            <line x1="42" y1="38" x2="32" y2="12" stroke="#D97706" strokeWidth="1.2" />
            <circle cx="32" cy="12" r="2" fill="#D97706" />
            {/* Cascading Vine strands */}
            <path d="M24 44 Q16 50 18 58" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 44 Q32 54 30 62" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            <path d="M40 44 Q46 52 44 60" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            {/* Heart-shaped Ivy Leaves */}
            <circle cx="17" cy="52" r="3" fill="#4ADE80" />
            <circle cx="31" cy="54" r="3.5" fill="#22C55E" />
            <circle cx="45" cy="53" r="3" fill="#86EFAC" />
            <circle cx="28" cy="60" r="2.5" fill="#15803D" />
          </svg>
        );

      case 'ریحان و نعنا':
      default:
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
            {/* Wooden/Stone Rustic Pot */}
            <path d="M22 45 L24 58 Q24 60 27 60 L37 60 Q40 60 40 58 L42 45 Z" fill="#84A98C" />
            <rect x="20" y="42" width="24" height="4" rx="2" fill="#52796F" />
            {/* Dense Herb Leaves */}
            <path d="M32 43 L32 26" stroke="#2F3E46" strokeWidth="2" strokeLinecap="round" />
            <circle cx="28" cy="36" r="5" fill="#52796F" />
            <circle cx="36" cy="36" r="5" fill="#52796F" />
            <circle cx="26" cy="28" r="6" fill="#84A98C" />
            <circle cx="38" cy="28" r="6" fill="#84A98C" />
            <circle cx="32" cy="20" r="7" fill="#A7C957" />
            <circle cx="32" cy="15" r="4.5" fill="#6A994E" />
            <ellipse cx="32" cy="18" rx="1" ry="2" fill="#FFF" opacity="0.6" />
          </svg>
        );
    }
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${animClass} ${className}`}>
      {renderSVG()}
    </div>
  );
};
