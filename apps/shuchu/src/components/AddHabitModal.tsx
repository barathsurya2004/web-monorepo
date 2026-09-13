import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Category, GoalType, ColorTheme, FrequencyType } from '@/types';
import { Modal, Input, Button } from '@packages/ui';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Category[] = ['Creative', 'Learning', 'Engineering', 'Mindfulness', 'Health', 'Personal'];
const GOAL_TYPES: { id: GoalType; label: string }[] = [
  { id: 'duration', label: 'Duration (min)' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'open-ended', label: 'Open Session' },
];
const FREQUENCY_OPTIONS: { id: FrequencyType; label: string }[] = [
  { id: 'daily', label: 'Daily (7d)' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'custom', label: 'Custom Days' },
];
const DAYS_OF_WEEK = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];
const COLOR_THEMES: { id: ColorTheme; label: string; bg: string }[] = [
  { id: 'clay', label: 'Terracotta', bg: '#C8634B' },
  { id: 'matcha', label: 'Matcha', bg: '#537D63' },
  { id: 'ochre', label: 'Ochre Seed', bg: '#C49045' },
  { id: 'river', label: 'River Mist', bg: '#4C7285' },
  { id: 'plum', label: 'Wild Plum', bg: '#835B74' },
];
const EMOJIS = ['🌱', '✏️', '🎹', '📖', '💻', '🧘', '🌿', '📓', '🍵', '🎨', '🏃', '💧'];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const { addHabit } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Creative');
  const [goalType, setGoalType] = useState<GoalType>('duration');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [targetValue, setTargetValue] = useState('30');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('clay');
  const [selectedEmoji, setSelectedEmoji] = useState('🌱');
  const [notes, setNotes] = useState('');

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTarget = parseInt(targetValue, 10) || (goalType === 'duration' ? 30 : 1);
    const unit = goalType === 'duration' ? 'min' : goalType === 'quantity' ? 'items' : 'session';

    addHabit({
      title: title.trim(),
      category,
      goalType,
      frequencyType,
      customDays: frequencyType === 'custom' ? customDays : undefined,
      targetValue: parsedTarget,
      unit,
      colorTheme,
      icon: selectedEmoji,
      notes: notes.trim(),
    });

    // Reset and close
    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cultivate a Mindful Habit 🌱">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        {/* Habit Name */}
        <Input
          label="Habit Name"
          placeholder="e.g. Figure Drawing, Morning Tea, C Programming..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Icon & Color Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">
            Stone Pebble Accent & Icon
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer shrink-0 ${
                  selectedEmoji === emoji
                    ? 'bg-white/20 border-2 border-[var(--clay-terracotta)] scale-110'
                    : 'hover:bg-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setColorTheme(theme.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                  colorTheme === theme.id ? 'ring-2 ring-white/50 border-white scale-[1.02]' : 'border-transparent opacity-75'
                }`}
                style={{ backgroundColor: theme.bg }}
              >
                {colorTheme === theme.id && '✓'} {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-md'
                    : 'bg-[#232044] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Type & Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">
              Target Goal Type
            </label>
            <div className="flex flex-col gap-1">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalType(g.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold transition-all text-left cursor-pointer ${
                    goalType === g.id
                      ? 'bg-[#FBD8B3] text-[#1A1835] font-black'
                      : 'bg-[#232044] text-slate-300 border border-white/10'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <Input
              label={`Target Value (${goalType === 'duration' ? 'minutes' : goalType === 'quantity' ? 'units' : 'sessions'})`}
              type="number"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
            />
            <div className="text-[11px] text-slate-400 font-serif italic mt-2">
              Tip: Daily manageable practices foster genuine lifelong consistency.
            </div>
          </div>
        </div>

        {/* Frequency & Practice Schedule */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold font-mono tracking-wider text-slate-300 uppercase">
            Practice Frequency & Schedule
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFrequencyType(opt.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer text-center ${
                  frequencyType === opt.id
                    ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-md'
                    : 'bg-[#232044] text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Day Toggles if 'custom' is selected */}
          {frequencyType === 'custom' && (
            <div className="flex items-center gap-1.5 mt-1 p-2 bg-[#232044] rounded-2xl border border-white/10">
              <span className="text-[11px] font-mono text-slate-400 mr-1">Active:</span>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = customDays.includes(d.day);
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => toggleDay(d.day)}
                    className={`flex-1 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#A8E6CF] text-[#1A1835]'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Notes */}
        <Input
          label="Mindful Intent / Notes (Optional)"
          placeholder="e.g. 1-min quick poses focusing on line of action"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* CTA Buttons */}
        <div className="flex gap-2.5 mt-2">
          <Button
            type="submit"
            variant="pastelTerracotta"
            className="flex-1 !rounded-2xl !min-h-[46px] font-mono text-sm uppercase tracking-wider"
          >
            Plant Habit 🌱
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="!rounded-2xl !min-h-[46px] px-5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
