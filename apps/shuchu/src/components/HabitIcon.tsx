import React from 'react';
import {
  Sprout,
  Pencil,
  Palette,
  BookOpen,
  Code2,
  Dumbbell,
  Coffee,
  Heart,
  Music,
  Brain,
  Compass,
  Feather,
  Flame,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export const HABIT_ICON_OPTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'sprout', label: 'Sprout', Icon: Sprout },
  { id: 'pencil', label: 'Drawing / Writing', Icon: Pencil },
  { id: 'palette', label: 'Art & Craft', Icon: Palette },
  { id: 'book', label: 'Reading', Icon: BookOpen },
  { id: 'code', label: 'Code & Tech', Icon: Code2 },
  { id: 'dumbbell', label: 'Exercise', Icon: Dumbbell },
  { id: 'coffee', label: 'Tea & Coffee', Icon: Coffee },
  { id: 'heart', label: 'Wellness', Icon: Heart },
  { id: 'music', label: 'Music', Icon: Music },
  { id: 'brain', label: 'Mindfulness', Icon: Brain },
  { id: 'compass', label: 'Explore', Icon: Compass },
  { id: 'feather', label: 'Journal', Icon: Feather },
];

const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  // Emojis mapped to Lucide
  '🌱': Sprout,
  '🌿': Sprout,
  '🍃': Feather,
  '✏️': Pencil,
  '✏': Pencil,
  '🎨': Palette,
  '📖': BookOpen,
  '📓': Feather,
  '💻': Code2,
  '🏃': Dumbbell,
  '💧': Heart,
  '🍵': Coffee,
  '☕': Coffee,
  '🎹': Music,
  '🧘': Brain,
  '🔥': Flame,
  '✦': Sparkles,
};

interface HabitIconProps {
  icon: string;
  className?: string;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ icon, className = 'w-5 h-5' }) => {
  // Check named key first
  const namedMatch = HABIT_ICON_OPTIONS.find((item) => item.id === icon);
  if (namedMatch) {
    const IconComp = namedMatch.Icon;
    return <IconComp className={className} />;
  }

  // Check emoji mapping
  const emojiMatch = EMOJI_TO_ICON[icon];
  if (emojiMatch) {
    const IconComp = emojiMatch;
    return <IconComp className={className} />;
  }

  // Default fallback
  return <Sprout className={className} />;
};
