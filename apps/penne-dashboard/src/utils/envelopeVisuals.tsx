import React from 'react';
import {
  Utensils,
  Home,
  Car,
  ShoppingBag,
  Zap,
  HeartPulse,
  Film,
  TrendingUp,
  GraduationCap,
  Coffee,
  Gift,
  Sparkles,
  Layers,
  Plane,
  Tv,
  Smartphone,
  Folder,
  Wallet,
  LucideIcon
} from 'lucide-react';

export interface EnvelopeVisualConfig {
  icon: LucideIcon;
  iconName: string;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

export const PRESET_ENVELOPE_ICONS: Record<string, EnvelopeVisualConfig> = {
  dining: {
    icon: Utensils,
    iconName: 'dining',
    label: 'Food & Dining',
    textColor: 'text-[#FBD8B3]',
    bgColor: 'bg-[#FBD8B3]/15',
    borderColor: 'border-[#FBD8B3]/30',
    glowColor: 'rgba(251,216,179,0.25)'
  },
  housing: {
    icon: Home,
    iconName: 'housing',
    label: 'Rent & Housing',
    textColor: 'text-[#A7D7F9]',
    bgColor: 'bg-[#A7D7F9]/15',
    borderColor: 'border-[#A7D7F9]/30',
    glowColor: 'rgba(167,215,249,0.25)'
  },
  commute: {
    icon: Car,
    iconName: 'commute',
    label: 'Commute & Travel',
    textColor: 'text-[#A8E6CF]',
    bgColor: 'bg-[#A8E6CF]/15',
    borderColor: 'border-[#A8E6CF]/30',
    glowColor: 'rgba(168,230,207,0.25)'
  },
  shopping: {
    icon: ShoppingBag,
    iconName: 'shopping',
    label: 'Shopping & Retail',
    textColor: 'text-[#FFB5A7]',
    bgColor: 'bg-[#FFB5A7]/15',
    borderColor: 'border-[#FFB5A7]/30',
    glowColor: 'rgba(255,181,167,0.25)'
  },
  utilities: {
    icon: Zap,
    iconName: 'utilities',
    label: 'Bills & Utilities',
    textColor: 'text-[#FDE2B8]',
    bgColor: 'bg-[#FDE2B8]/15',
    borderColor: 'border-[#FDE2B8]/30',
    glowColor: 'rgba(253,226,184,0.25)'
  },
  health: {
    icon: HeartPulse,
    iconName: 'health',
    label: 'Health & Wellness',
    textColor: 'text-[#F472B6]',
    bgColor: 'bg-[#F472B6]/15',
    borderColor: 'border-[#F472B6]/30',
    glowColor: 'rgba(244,114,182,0.25)'
  },
  entertainment: {
    icon: Film,
    iconName: 'entertainment',
    label: 'Entertainment & Subs',
    textColor: 'text-[#C8B6FF]',
    bgColor: 'bg-[#C8B6FF]/15',
    borderColor: 'border-[#C8B6FF]/30',
    glowColor: 'rgba(200,182,255,0.25)'
  },
  investing: {
    icon: TrendingUp,
    iconName: 'investing',
    label: 'Savings & Investments',
    textColor: 'text-[#6EE7B7]',
    bgColor: 'bg-[#6EE7B7]/15',
    borderColor: 'border-[#6EE7B7]/30',
    glowColor: 'rgba(110,231,183,0.25)'
  },
  education: {
    icon: GraduationCap,
    iconName: 'education',
    label: 'Education & Learning',
    textColor: 'text-[#38BDF8]',
    bgColor: 'bg-[#38BDF8]/15',
    borderColor: 'border-[#38BDF8]/30',
    glowColor: 'rgba(56,189,248,0.25)'
  },
  cafe: {
    icon: Coffee,
    iconName: 'cafe',
    label: 'Coffee & Snacks',
    textColor: 'text-[#FBD8B3]',
    bgColor: 'bg-[#FBD8B3]/15',
    borderColor: 'border-[#FBD8B3]/30',
    glowColor: 'rgba(251,216,179,0.25)'
  },
  gifts: {
    icon: Gift,
    iconName: 'gifts',
    label: 'Gifts & Donations',
    textColor: 'text-[#FDA4AF]',
    bgColor: 'bg-[#FDA4AF]/15',
    borderColor: 'border-[#FDA4AF]/30',
    glowColor: 'rgba(253,164,175,0.25)'
  },
  personal: {
    icon: Sparkles,
    iconName: 'personal',
    label: 'Personal Care',
    textColor: 'text-[#E879F9]',
    bgColor: 'bg-[#E879F9]/15',
    borderColor: 'border-[#E879F9]/30',
    glowColor: 'rgba(232,121,249,0.25)'
  },
  travel: {
    icon: Plane,
    iconName: 'travel',
    label: 'Flights & Vacations',
    textColor: 'text-[#818CF8]',
    bgColor: 'bg-[#818CF8]/15',
    borderColor: 'border-[#818CF8]/30',
    glowColor: 'rgba(129,140,248,0.25)'
  },
  media: {
    icon: Tv,
    iconName: 'media',
    label: 'Streaming & Media',
    textColor: 'text-[#A78BFA]',
    bgColor: 'bg-[#A78BFA]/15',
    borderColor: 'border-[#A78BFA]/30',
    glowColor: 'rgba(167,139,250,0.25)'
  },
  gadgets: {
    icon: Smartphone,
    iconName: 'gadgets',
    label: 'Tech & Gadgets',
    textColor: 'text-[#93C5FD]',
    bgColor: 'bg-[#93C5FD]/15',
    borderColor: 'border-[#93C5FD]/30',
    glowColor: 'rgba(147,197,253,0.25)'
  },
  general: {
    icon: Layers,
    iconName: 'general',
    label: 'General Allocation',
    textColor: 'text-slate-300',
    bgColor: 'bg-white/10',
    borderColor: 'border-white/15',
    glowColor: 'rgba(255,255,255,0.1)'
  }
};

const PALETTE_ROTATION = [
  PRESET_ENVELOPE_ICONS.dining,
  PRESET_ENVELOPE_ICONS.housing,
  PRESET_ENVELOPE_ICONS.commute,
  PRESET_ENVELOPE_ICONS.shopping,
  PRESET_ENVELOPE_ICONS.utilities,
  PRESET_ENVELOPE_ICONS.health,
  PRESET_ENVELOPE_ICONS.entertainment,
  PRESET_ENVELOPE_ICONS.investing,
  PRESET_ENVELOPE_ICONS.education,
  PRESET_ENVELOPE_ICONS.personal
];

/**
 * Derives a consistent visual identity (Lucide icon + velvet color styling)
 * for an envelope based on its name or optional explicit iconKey override.
 */
export function getEnvelopeVisual(name?: string, explicitKey?: string): EnvelopeVisualConfig {
  if (explicitKey && PRESET_ENVELOPE_ICONS[explicitKey]) {
    return PRESET_ENVELOPE_ICONS[explicitKey];
  }

  const raw = (name || '').toLowerCase().trim();

  if (!raw) {
    return PRESET_ENVELOPE_ICONS.general;
  }

  // Smart Keyword Pattern Matching
  if (/\b(food|dine|dining|grocer|grocery|snack|restaurant|swiggy|zomato|eat|lunch|dinner|breakfast|meal)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.dining;
  }
  if (/\b(coffee|cafe|tea|starbucks|chai|boba)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.cafe;
  }
  if (/\b(rent|housing|house|home|flat|apartment|maintenance|property|mortgage)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.housing;
  }
  if (/\b(commute|fuel|petrol|diesel|gas|uber|ola|cab|auto|transport|bus|metro|train|transit|car|bike)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.commute;
  }
  if (/\b(flight|vacation|trip|hotel|airbnb|travel|tour|plane)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.travel;
  }
  if (/\b(shop|shopping|cloth|clothes|dress|amazon|flipkart|myntra|retail|shoe|shoes|apparel)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.shopping;
  }
  if (/\b(bill|bills|utility|utilities|electric|electricity|power|wifi|internet|water|recharge|mobile|phone|broadband)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.utilities;
  }
  if (/\b(health|medical|medicine|doctor|pharmacy|fitness|gym|hospital|dental|clinic|care|med)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.health;
  }
  if (/\b(entertainment|movie|movies|cinema|netflix|spotify|prime|youtube|game|gaming|fun|party|ticket|tickets|concert)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.entertainment;
  }
  if (/\b(stream|tv|series|hotstar|hulu|media)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.media;
  }
  if (/\b(invest|investment|savings|saving|sip|stock|stocks|mutual|gold|crypto|deposit|emergency|vault)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.investing;
  }
  if (/\b(education|course|courses|book|books|study|tuition|school|college|learn|learning|class|classes)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.education;
  }
  if (/\b(gift|gifts|donation|charity|birthday|present|festive|diwali|christmas)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.gifts;
  }
  if (/\b(salon|spa|grooming|beauty|hair|skincare|cosmetics|personal)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.personal;
  }
  if (/\b(gadget|gadgets|tech|laptop|phone|apple|mobile|hardware|device)\b/.test(raw)) {
    return PRESET_ENVELOPE_ICONS.gadgets;
  }

  // Deterministic Hash Selection for untyped categories
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE_ROTATION.length;
  const picked = PALETTE_ROTATION[index];

  return {
    ...picked,
    icon: Layers,
    label: name || 'Custom Envelope'
  };
}

/**
 * Gets a clean 2-letter uppercase monogram fallback.
 */
export function getEnvelopeMonogram(name?: string): string {
  if (!name) return 'EN';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface EnvelopeIconBadgeProps {
  name?: string;
  iconKey?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const EnvelopeIconBadge: React.FC<EnvelopeIconBadgeProps> = ({
  name,
  iconKey,
  size = 'md',
  className = ''
}) => {
  const visual = getEnvelopeVisual(name, iconKey);
  const Icon = visual.icon;

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg text-xs',
    sm: 'w-7 h-7 rounded-xl text-xs',
    md: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-sm',
    lg: 'w-11 h-11 rounded-2xl text-base'
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  return (
    <div
      className={`${sizeClasses} ${visual.bgColor} ${visual.textColor} border ${visual.borderColor} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 aspect-square ${className}`}
      style={{ boxShadow: `0 0 10px ${visual.glowColor}` }}
      title={name || visual.label}
    >
      <Icon className={`${iconSizes} stroke-[2.2]`} />
    </div>
  );
};

export const EnvelopeMonogramBadge: React.FC<{
  name?: string;
  envId?: string;
  emoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ name, size = 'md', className = '' }) => {
  const monogram = getEnvelopeMonogram(name);
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg text-[10px]',
    sm: 'w-7 h-7 rounded-xl text-xs',
    md: 'w-9 h-9 rounded-2xl text-xs',
    lg: 'w-12 h-12 rounded-2xl text-sm'
  }[size];

  return (
    <div
      className={`${sizeClasses} bg-[#232044] border border-[#FBD8B3]/30 text-[#FBD8B3] font-mono font-black flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.25)] aspect-square hover:border-[#FBD8B3]/60 transition-all duration-200 select-none ${className}`}
      title={name}
    >
      <span className="leading-none tracking-tight">{monogram}</span>
    </div>
  );
};

// Backwards-compatibility alias so any lingering references render clean monograms instead of emojis
export const EnvelopeEmojiBadge = EnvelopeMonogramBadge;

