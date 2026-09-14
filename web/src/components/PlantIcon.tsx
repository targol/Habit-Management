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
  { id: 'پیچک رونده', name: 'پیچک رونده سبز', description: 'نماد پیوستگی و بالا رفتن مداوم' },
  { id: 'ریحان و نعنا', name: 'ریحان و نعنای معطر', description: 'نماد طراوت ذهن و سلامتی پایدار روزانه' },
  { id: 'ارکیده', name: 'ارکیده باشکوه', description: 'نماد ظرافت، تمرکز عمیق و خلاقیت ناب' },
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

  // Render refined, high-craft botanical vector icons
  const renderSVG = () => {
    switch (type) {
      case 'برگ انجیری':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="monsteraPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E29578" />
                <stop offset="100%" stopColor="#C86D51" />
              </linearGradient>
              <linearGradient id="monsteraLeaf1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#52B788" />
                <stop offset="100%" stopColor="#1B4332" />
              </linearGradient>
              <linearGradient id="monsteraLeaf2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#74C69D" />
                <stop offset="100%" stopColor="#2D6A4F" />
              </linearGradient>
            </defs>
            {/* Minimalist Ceramic Cylinder Pot */}
            <path d="M20 46 L22 58 Q23 60 26 60 L38 60 Q41 60 42 58 L44 46 Z" fill="url(#monsteraPot)" />
            <rect x="18.5" y="43" width="27" height="4" rx="2" fill="#D36B4F" />
            <ellipse cx="32" cy="45" rx="12" ry="2" fill="#3D2619" opacity="0.4" />
            {/* Main Center Stems */}
            <path d="M32 45 Q31 34 22 23" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 45 Q35 32 44 24" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 45 Q32 28 32 14" stroke="#2D6A4F" strokeWidth="2.4" strokeLinecap="round" />
            {/* Left Monstera Leaf with cutouts */}
            <path d="M22 23 C14 21 11 31 19 36 C22 37 25 35 25 32 C25 28 23 24 22 23 Z" fill="url(#monsteraLeaf1)" />
            <ellipse cx="17" cy="27" rx="1.2" ry="2.5" transform="rotate(-30 17 27)" fill="#FEFAE0" opacity="0.85" />
            {/* Right Monstera Leaf with cutouts */}
            <path d="M44 24 C52 22 54 32 46 37 C43 38 40 36 40 33 C40 29 42 25 44 24 Z" fill="url(#monsteraLeaf1)" />
            <ellipse cx="48" cy="29" rx="1.2" ry="2.5" transform="rotate(30 48 29)" fill="#FEFAE0" opacity="0.85" />
            {/* Grand Center Leaf */}
            <path d="M32 12 C24 7 19 18 27 27 C30 30 34 30 37 27 C45 18 40 7 32 12 Z" fill="url(#monsteraLeaf2)" />
            <path d="M32 14 L32 28" stroke="#B7E4C7" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="27" cy="18" rx="1" ry="2.4" transform="rotate(-20 27 18)" fill="#FEFAE0" opacity="0.9" />
            <ellipse cx="37" cy="18" rx="1" ry="2.4" transform="rotate(20 37 18)" fill="#FEFAE0" opacity="0.9" />
            {/* Subtle pot accent ring */}
            <line x1="22" y1="52" x2="42" y2="52" stroke="#FEFAE0" strokeWidth="1.2" opacity="0.4" />
          </svg>
        );

      case 'بونسای':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bonsaiDish" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="50%" stopColor="#4B5563" />
                <stop offset="100%" stopColor="#1F2937" />
              </linearGradient>
              <linearGradient id="bonsaiFoliage" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="50%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#14532D" />
              </linearGradient>
            </defs>
            {/* Shallow Zen Dish on Feet */}
            <ellipse cx="32" cy="56" rx="23" ry="4.5" fill="url(#bonsaiDish)" />
            <rect x="14" y="58" width="5" height="2" rx="1" fill="#111827" />
            <rect x="45" y="58" width="5" height="2" rx="1" fill="#111827" />
            <ellipse cx="32" cy="55" rx="19" ry="2.5" fill="#3E2723" />
            <ellipse cx="32" cy="54.5" rx="16" ry="1.8" fill="#556B2F" opacity="0.7" />
            {/* Masterfully Sculpted Trunk */}
            <path d="M31 55 Q36 46 29 38 Q22 31 27 24 Q31 17 35 15" stroke="#795548" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M29 38 Q39 34 45 31" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" />
            <path d="M27 25 Q20 22 17 21" stroke="#6D4C41" strokeWidth="2.2" strokeLinecap="round" />
            {/* Left Cloud Tier */}
            <circle cx="17" cy="20" r="5.5" fill="#15803D" />
            <circle cx="21" cy="18" r="6.5" fill="#22C55E" />
            <circle cx="16" cy="17" r="4.5" fill="#4ADE80" />
            {/* Right Cloud Tier */}
            <circle cx="46" cy="30" r="6" fill="#15803D" />
            <circle cx="42" cy="27" r="6.5" fill="#22C55E" />
            <circle cx="47" cy="26" r="4.5" fill="#86EFAC" />
            {/* Crown Cloud Top */}
            <ellipse cx="35" cy="14" rx="9" ry="6.5" fill="#14532D" />
            <ellipse cx="34" cy="12" rx="8" ry="5.5" fill="url(#bonsaiFoliage)" />
            <ellipse cx="32" cy="10" rx="6" ry="4" fill="#86EFAC" opacity="0.9" />
          </svg>
        );

      case 'کاکتوس گلدار':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cactusBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1E6F5C" />
                <stop offset="35%" stopColor="#289672" />
                <stop offset="70%" stopColor="#29BB89" />
                <stop offset="100%" stopColor="#1E6F5C" />
              </linearGradient>
              <linearGradient id="terracotta" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4A261" />
                <stop offset="100%" stopColor="#E76F51" />
              </linearGradient>
            </defs>
            {/* Chic Minimalist Pot */}
            <path d="M22 46 L24 58 Q24 60 27 60 L37 60 Q40 60 40 58 L42 46 Z" fill="url(#terracotta)" />
            <rect x="20" y="43" width="24" height="4" rx="2" fill="#D35400" />
            {/* Main Ribbed Cactus Column */}
            <path d="M25 45 C25 23 39 23 39 45 Z" fill="url(#cactusBody)" />
            {/* Vertical Rib lines */}
            <path d="M28 45 C28 27 30 25 32 23" stroke="#134E3F" strokeWidth="1.2" opacity="0.5" />
            <path d="M36 45 C36 27 34 25 32 23" stroke="#134E3F" strokeWidth="1.2" opacity="0.5" />
            <line x1="32" y1="45" x2="32" y2="22" stroke="#E8F5E9" strokeWidth="1.2" opacity="0.7" />
            {/* Side Branch */}
            <path d="M25 36 Q17 36 17 28 Q17 25 20 25 Q23 25 23 28 L24 37" fill="#289672" stroke="#134E3F" strokeWidth="0.8" />
            <path d="M39 34 Q47 34 47 27 Q47 24 44 24 Q41 24 41 27 L40 36" fill="#289672" stroke="#134E3F" strokeWidth="0.8" />
            {/* Star Needle dots */}
            <circle cx="28" cy="32" r="0.7" fill="#FFF9C4" />
            <circle cx="36" cy="32" r="0.7" fill="#FFF9C4" />
            <circle cx="32" cy="37" r="0.7" fill="#FFF9C4" />
            <circle cx="32" cy="28" r="0.7" fill="#FFF9C4" />
            {/* Exquisite Desert Flower Blossom on top */}
            <circle cx="32" cy="20" r="4.5" fill="#E63946" />
            <circle cx="29" cy="18" r="3.2" fill="#F72585" />
            <circle cx="35" cy="18" r="3.2" fill="#F72585" />
            <circle cx="32" cy="16" r="3.5" fill="#FF70A6" />
            <circle cx="32" cy="18.5" r="1.8" fill="#FFD166" />
          </svg>
        );

      case 'نیلوفر آبی':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lotusWater" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="lotusPetal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF758F" />
                <stop offset="60%" stopColor="#FFB3C1" />
                <stop offset="100%" stopColor="#FFF0F3" />
              </linearGradient>
            </defs>
            {/* Serene Water pool & Lily pad */}
            <ellipse cx="32" cy="54" rx="25" ry="5.5" fill="url(#lotusWater)" />
            <path d="M12 51 C12 44 52 44 52 51 C52 57 37 58 32 52 C27 58 12 57 12 51 Z" fill="#2D6A4F" />
            <ellipse cx="32" cy="51" rx="18" ry="3.5" fill="#40916C" />
            {/* Outer Petals */}
            <path d="M18 46 C21 34 29 46 29 46 Z" fill="#E01E5A" opacity="0.85" />
            <path d="M46 46 C43 34 35 46 35 46 Z" fill="#E01E5A" opacity="0.85" />
            <path d="M22 47 C26 30 35 47 35 47 Z" fill="#F72585" />
            <path d="M42 47 C38 30 29 47 29 47 Z" fill="#F72585" />
            {/* Center Layer Petals */}
            <path d="M26 47 C29 25 37 47 37 47 Z" fill="url(#lotusPetal)" />
            <path d="M38 47 C35 25 27 47 27 47 Z" fill="url(#lotusPetal)" />
            <path d="M32 47 C29 22 35 22 32 47 Z" fill="#FFF0F3" />
            {/* Golden Core */}
            <circle cx="32" cy="40" r="3.2" fill="#FFB703" />
            <circle cx="32" cy="40" r="1.6" fill="#FB8500" />
          </svg>
        );

      case 'آفتابگردان':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sunflowerPetals" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD166" />
                <stop offset="100%" stopColor="#F77F00" />
              </linearGradient>
            </defs>
            {/* Plant Pot */}
            <path d="M24 47 L26 58 Q26 60 28 60 L36 60 Q38 60 38 58 L40 47 Z" fill="#4F772D" />
            <rect x="22" y="44" width="20" height="3.5" rx="1.5" fill="#31572C" />
            {/* Sturdy Stem and Leaves */}
            <path d="M32 46 L32 26" stroke="#588157" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 38 Q22 35 24 30 Q28 32 32 36" fill="#588157" />
            <path d="M32 34 Q42 31 40 26 Q36 28 32 32" fill="#3A5A40" />
            {/* Sunflower Golden Petals Array */}
            <circle cx="32" cy="21" r="16" fill="url(#sunflowerPetals)" />
            <circle cx="32" cy="21" r="14" fill="#FCBF49" />
            {/* Rich Seed Center */}
            <circle cx="32" cy="21" r="8.5" fill="#582F0E" />
            <circle cx="32" cy="21" r="6.5" fill="#3F1D0B" />
            <circle cx="30.5" cy="20" r="1" fill="#7F4F24" />
            <circle cx="33.5" cy="20" r="1" fill="#7F4F24" />
            <circle cx="32" cy="23" r="1" fill="#7F4F24" />
          </svg>
        );

      case 'گل سرخ':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rosePot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9C6644" />
                <stop offset="100%" stopColor="#7F4F24" />
              </linearGradient>
              <linearGradient id="rosePetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D90429" />
                <stop offset="50%" stopColor="#EF233C" />
                <stop offset="100%" stopColor="#9B2226" />
              </linearGradient>
            </defs>
            {/* Ceramic Glazed Planter */}
            <path d="M23 47 L25 58 Q25 60 28 60 L36 60 Q39 60 39 58 L41 47 Z" fill="url(#rosePot)" />
            <rect x="21" y="44" width="22" height="4" rx="2" fill="#582F0E" />
            {/* Thorny Rose Stem */}
            <path d="M32 45 Q31 34 32 25" stroke="#2D6A4F" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M32 38 Q24 35 25 41" stroke="#2D6A4F" strokeWidth="2" fill="#52B788" />
            <path d="M32 33 Q40 30 39 36" stroke="#2D6A4F" strokeWidth="2" fill="#40916C" />
            {/* Velvety Spiral Rose Flower */}
            <circle cx="32" cy="20" r="12" fill="url(#rosePetalGrad)" />
            <circle cx="30" cy="19" r="8.5" fill="#EF233C" />
            <circle cx="34" cy="19" r="7" fill="#E63946" />
            <circle cx="32" cy="18" r="5" fill="#FF4D6D" />
            <circle cx="32" cy="17" r="3" fill="#FF758F" />
            <path d="M30 17 Q32 15 34 17" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
          </svg>
        );

      case 'بامبو شانس':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bambooGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* Glass Vase with Pebbles */}
            <rect x="21" y="42" width="22" height="18" rx="3" fill="url(#bambooGlass)" stroke="#38BDF8" strokeWidth="1.2" />
            <ellipse cx="27" cy="56" rx="3.5" ry="2" fill="#94A3B8" />
            <ellipse cx="37" cy="56" rx="3.5" ry="2" fill="#64748B" />
            <ellipse cx="32" cy="57" rx="3.8" ry="2" fill="#CBD5E1" />
            {/* Bamboo Stalk 1 */}
            <rect x="24" y="20" width="4.2" height="26" rx="1.5" fill="#22C55E" />
            <line x1="23" y1="28" x2="29" y2="28" stroke="#15803D" strokeWidth="1.5" />
            <line x1="23" y1="36" x2="29" y2="36" stroke="#15803D" strokeWidth="1.5" />
            {/* Bamboo Stalk 2 (Center tall) */}
            <rect x="30" y="11" width="4.5" height="35" rx="1.5" fill="#4ADE80" />
            <line x1="29" y1="19" x2="35.5" y2="19" stroke="#16A34A" strokeWidth="1.5" />
            <line x1="29" y1="29" x2="35.5" y2="29" stroke="#16A34A" strokeWidth="1.5" />
            {/* Bamboo Stalk 3 */}
            <rect x="36" y="15" width="4.2" height="31" rx="1.5" fill="#16A34A" />
            <line x1="35" y1="23" x2="41" y2="23" stroke="#15803D" strokeWidth="1.5" />
            <line x1="35" y1="32" x2="41" y2="32" stroke="#15803D" strokeWidth="1.5" />
            {/* Graceful Arching Shoots */}
            <path d="M25 18 Q19 15 21 11" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M32 9 Q32 3 36 5" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M38 13 Q45 11 43 7" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'پیچک رونده':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            {/* Hanging Planter Cord */}
            <line x1="22" y1="39" x2="32" y2="10" stroke="#B45309" strokeWidth="1.2" />
            <line x1="42" y1="39" x2="32" y2="10" stroke="#B45309" strokeWidth="1.2" />
            <circle cx="32" cy="10" r="2" fill="#92400E" />
            {/* Clay Hanging Bowl */}
            <path d="M19 39 L23 49 Q24 51 27 51 L37 51 Q40 51 41 49 L45 39 Z" fill="#9A3412" />
            {/* Gracefully Cascading Ivy Tendrils */}
            <path d="M23 44 Q15 50 17 60" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 46 Q33 54 30 63" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
            <path d="M41 44 Q47 52 44 61" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            {/* Heart/Star-shaped Ivy Leaves */}
            <circle cx="16" cy="51" r="3.2" fill="#4ADE80" />
            <circle cx="18" cy="58" r="2.8" fill="#22C55E" />
            <circle cx="31" cy="53" r="3.6" fill="#22C55E" />
            <circle cx="29" cy="61" r="2.8" fill="#15803D" />
            <circle cx="45" cy="52" r="3.4" fill="#86EFAC" />
            <circle cx="43" cy="59" r="2.8" fill="#16A34A" />
          </svg>
        );

      case 'ارکیده':
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="orchidPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <linearGradient id="orchidPetals" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDF4FF" />
                <stop offset="100%" stopColor="#E879F9" />
              </linearGradient>
            </defs>
            {/* Ceramic Pot */}
            <path d="M23 47 L25 58 Q25 60 28 60 L36 60 Q39 60 39 58 L41 47 Z" fill="url(#orchidPot)" />
            <rect x="21" y="44" width="22" height="4" rx="2" fill="#64748B" />
            {/* Slender Arched Stem */}
            <path d="M32 45 Q31 30 36 20 Q40 12 47 14" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
            {/* Base Leaves */}
            <ellipse cx="25" cy="46" rx="8" ry="3" transform="rotate(-15 25 46)" fill="#16A34A" />
            <ellipse cx="39" cy="46" rx="8" ry="3" transform="rotate(15 39 46)" fill="#15803D" />
            {/* Main Orchid Flower 1 */}
            <circle cx="36" cy="20" r="5" fill="url(#orchidPetals)" />
            <ellipse cx="32" cy="20" rx="3.5" ry="2" transform="rotate(-30 32 20)" fill="#F0ABFC" />
            <ellipse cx="40" cy="20" rx="3.5" ry="2" transform="rotate(30 40 20)" fill="#F0ABFC" />
            <circle cx="36" cy="21" r="2" fill="#C026D3" />
            <circle cx="36" cy="21" r="0.8" fill="#FACC15" />
            {/* Orchid Flower 2 (Top bud) */}
            <circle cx="45" cy="14" r="4" fill="url(#orchidPetals)" />
            <circle cx="45" cy="14.5" r="1.5" fill="#C026D3" />
          </svg>
        );

      case 'ریحان و نعنا':
      default:
        return (
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="herbPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A3B18A" />
                <stop offset="100%" stopColor="#588157" />
              </linearGradient>
            </defs>
            {/* Earthy Sage Pot */}
            <path d="M22 46 L24 58 Q24 60 27 60 L37 60 Q40 60 40 58 L42 46 Z" fill="url(#herbPot)" />
            <rect x="20" y="43" width="24" height="4" rx="2" fill="#3A5A40" />
            {/* Stems */}
            <path d="M32 44 L32 24" stroke="#344E41" strokeWidth="2.2" strokeLinecap="round" />
            {/* Lush Paired Basil & Mint Leaves */}
            <ellipse cx="27" cy="38" rx="5.5" ry="4" transform="rotate(-25 27 38)" fill="#588157" />
            <ellipse cx="37" cy="38" rx="5.5" ry="4" transform="rotate(25 37 38)" fill="#3A5A40" />
            <ellipse cx="25" cy="29" rx="6.5" ry="4.5" transform="rotate(-30 25 29)" fill="#84A98C" />
            <ellipse cx="39" cy="29" rx="6.5" ry="4.5" transform="rotate(30 39 29)" fill="#588157" />
            <circle cx="32" cy="19" r="6.5" fill="#A7C957" />
            <circle cx="32" cy="14" r="4.5" fill="#6A994E" />
            <path d="M32 12 L32 23" stroke="#F1FAEE" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
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
