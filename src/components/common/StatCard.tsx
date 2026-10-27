import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'amber' | 'emerald' | 'blue' | 'rose' | 'stone' | 'purple';
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'amber',
  onClick,
  badge,
}) => {
  const colorStyles = {
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200/60',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200/60',
    },
    blue: {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200/60',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200/60',
    },
    stone: {
      bg: 'bg-stone-100',
      text: 'text-stone-800',
      border: 'border-stone-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200/60',
    },
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-amber-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-stone-500 font-medium">{subtitle}</p>
          )}
          {badge && (
            <span className="mt-2 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
              {badge}
            </span>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border} border`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
