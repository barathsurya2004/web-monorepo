import React from 'react';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'apple';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/25 focus:ring-emerald-500',
    apple: 'bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-lg shadow-white/10 focus:ring-white',
    secondary: 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 focus:ring-slate-600 border border-slate-700/80',
    outline: 'border border-slate-700/80 hover:bg-slate-800/60 text-slate-200 focus:ring-slate-600 backdrop-blur-sm',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-lg shadow-rose-950/40',
    ghost: 'hover:bg-slate-800/40 text-slate-300 hover:text-white focus:ring-slate-600'
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
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
      className={`bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-black/60 transition-all duration-300 hover:border-slate-700/80 ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
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
      {label && <label className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-slate-500 pointer-events-none">{icon}</div>}
        <input
          className={`bg-slate-950/80 border ${error ? 'border-rose-500/80' : 'border-slate-800'} text-slate-100 placeholder-slate-500 text-sm rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 ${icon ? 'pl-10' : 'px-4'} py-3 transition-all w-full shadow-inner ${className}`}
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
      {label && <label className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</label>}
      <select
        className={`bg-slate-950/80 border border-slate-800 text-slate-100 text-sm rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 px-4 py-3 transition-all w-full shadow-inner ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
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
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo' | 'apple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variants = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    apple: 'bg-white/10 text-slate-100 border-white/20 backdrop-blur-md'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Segmented Control Component (Apple Style)
export interface SegmentedControlProps {
  options: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, activeId, onChange }) => {
  return (
    <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 flex items-center gap-1 backdrop-blur-xl">
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-slate-800 text-white shadow-md shadow-black/40 border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
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
  value: number; // 0 to 100
  colorVariant?: 'emerald' | 'amber' | 'rose' | 'indigo';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, colorVariant = 'emerald', className = '' }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  
  const colors = {
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-600 to-yellow-400',
    rose: 'bg-gradient-to-r from-rose-600 to-pink-500',
    indigo: 'bg-gradient-to-r from-indigo-600 to-violet-400'
  };

  return (
    <div className={`w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800/50 ${className}`}>
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
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'border-l-emerald-500'
}) => {
  return (
    <Card className={`border-l-4 ${accentColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-slate-50 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="p-3 bg-slate-800/60 text-slate-300 rounded-xl">{icon}</div>}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
