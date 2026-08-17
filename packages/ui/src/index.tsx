import React from 'react';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'pastelSage' | 'pastelRose' | 'pastelTerracotta' | 'ghost' | 'apple';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.97]';
  
  const variants = {
    primary: 'bg-[#E07A5F] hover:bg-[#d0694e] text-white shadow-md shadow-[#E07A5F]/20 focus:ring-[#E07A5F]',
    pastelSage: 'bg-[#81B29A] hover:bg-[#72a38b] text-slate-900 shadow-md shadow-[#81B29A]/20 focus:ring-[#81B29A]',
    pastelRose: 'bg-[#E8A598] hover:bg-[#d99487] text-slate-900 shadow-md shadow-[#E8A598]/20 focus:ring-[#E8A598]',
    pastelTerracotta: 'bg-[#D4A373] hover:bg-[#c59464] text-slate-900 shadow-md shadow-[#D4A373]/20 focus:ring-[#D4A373]',
    secondary: 'bg-[#2E2A27] hover:bg-[#383330] text-[#F4F1DE] focus:ring-amber-500/30 border border-[#3E3835]',
    outline: 'border border-[#3E3835] hover:bg-[#2A2623] text-[#E6E1DA] focus:ring-amber-500/20 backdrop-blur-sm',
    danger: 'bg-rose-500/90 hover:bg-rose-600 text-white focus:ring-rose-500 shadow-md shadow-rose-950/30',
    ghost: 'hover:bg-[#2A2623] text-[#B0A79E] hover:text-[#F4F1DE] focus:ring-amber-500/20',
    apple: 'bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-md focus:ring-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]'
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Card Component
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#24201D] border border-[#342F2C] rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/30 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-[#4A433F] hover:scale-[1.01]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold tracking-wider text-[#A89F95] uppercase">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-[#8C837A] pointer-events-none">{icon}</div>}
        <input
          className={`bg-[#1A1715] border ${error ? 'border-rose-400' : 'border-[#38322E]'} text-[#F4F1DE] placeholder-[#6E665E] text-base sm:text-sm rounded-2xl focus:outline-none focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/20 ${icon ? 'pl-10' : 'px-4'} py-3 transition-all w-full min-h-[44px] shadow-inner ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
    </div>
  );
};

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-bold tracking-wider text-[#A89F95] uppercase">{label}</label>}
      <select
        className={`bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] text-base sm:text-sm rounded-2xl focus:outline-none focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/20 px-4 py-3 transition-all w-full min-h-[44px] shadow-inner ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#24201D] text-[#F4F1DE]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Badge Component
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sage' | 'terracotta' | 'rose' | 'cream' | 'peach' | 'slate' | 'emerald' | 'amber' | 'indigo' | 'apple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variants = {
    sage: 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/30',
    terracotta: 'bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/30',
    rose: 'bg-[#E8A598]/15 text-[#E8A598] border-[#E8A598]/30',
    cream: 'bg-[#F2CC8F]/15 text-[#F2CC8F] border-[#F2CC8F]/30',
    peach: 'bg-[#F4A261]/15 text-[#F4A261] border-[#F4A261]/30',
    slate: 'bg-[#2E2A27] text-[#C4BBB1] border-[#3E3835]',
    emerald: 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/30',
    amber: 'bg-[#F2CC8F]/15 text-[#F2CC8F] border-[#F2CC8F]/30',
    indigo: 'bg-[#B8C0E0]/15 text-[#B8C0E0] border-[#B8C0E0]/30',
    apple: 'bg-white/10 text-[#F4F1DE] border-white/20'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Segmented Control
export interface SegmentedControlProps {
  options: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, activeId, onChange }) => {
  return (
    <div className="bg-[#1A1715] p-1 rounded-2xl border border-[#38322E] flex items-center gap-1 overflow-x-auto no-scrollbar">
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-[#38322E] text-[#F4F1DE] shadow-md border border-[#4A433F]'
                : 'text-[#A89F95] hover:text-[#F4F1DE]'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ProgressBar Component
export interface ProgressBarProps {
  value: number;
  colorVariant?: 'emerald' | 'amber' | 'rose' | 'indigo';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, colorVariant = 'emerald', className = '' }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const colors = {
    emerald: 'bg-[#81B29A]',
    amber: 'bg-[#F2CC8F]',
    rose: 'bg-[#E8A598]',
    indigo: 'bg-[#B8C0E0]'
  };

  return (
    <div className={`w-full bg-[#1A1715] rounded-full h-2 overflow-hidden border border-[#38322E] ${className}`}>
      <div
        className={`h-full transition-all duration-500 rounded-full ${colors[colorVariant]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

// StatCard Component
export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'terracotta' | 'sage' | 'cream' | 'rose';
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'terracotta',
  accentColor,
  className = '',
  children
}) => {
  const borderAccents = {
    terracotta: 'border-l-[#E07A5F] bg-gradient-to-br from-[#292421] to-[#211D1A]',
    sage: 'border-l-[#81B29A] bg-gradient-to-br from-[#222926] to-[#1C211F]',
    cream: 'border-l-[#F2CC8F] bg-gradient-to-br from-[#2B2720] to-[#221F19]',
    rose: 'border-l-[#E8A598] bg-gradient-to-br from-[#2B2322] to-[#211B1B]'
  };

  return (
    <Card className={`border-l-4 ${borderAccents[variant]} ${accentColor ? accentColor : ''} ${className}`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-[#A89F95] uppercase truncate">{title}</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#F4F1DE] tracking-tight truncate">{value}</h3>
          {subtitle && <p className="text-xs text-[#8C837A] truncate">{subtitle}</p>}
        </div>
        {icon && <div className="p-2.5 sm:p-3 bg-[#1A1715]/80 text-[#E6E1DA] rounded-2xl shadow-inner shrink-0 self-start">{icon}</div>}
      </div>
      {children && <div className="mt-3 pt-2.5 border-t border-[#38322E]/60">{children}</div>}
    </Card>
  );
};

// Modal Component
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#141210]/85 backdrop-blur-md animate-fadeIn pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
      <div className="bg-[#24201D] border border-[#3E3835] rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all max-h-[85dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#342F2C] bg-[#1E1B19] shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-[#F4F1DE]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#A89F95] hover:text-[#F4F1DE] p-2 rounded-xl hover:bg-[#2E2A27] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
