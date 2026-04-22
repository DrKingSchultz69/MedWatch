import { memo, useMemo } from 'react';
import { type VitalStatus } from '@/stores/vitalsStore';

interface VitalGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  status: VitalStatus;
  color: string;
  icon?: React.ReactNode;
}

const STATUS_COLORS: Record<VitalStatus, string> = {
  normal: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--danger))',
};

const VitalGauge = memo(({ value, min, max, unit, label, status, color }: VitalGaugeProps) => {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  const strokeColor = STATUS_COLORS[status];
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="glass-card p-4 flex flex-col items-center gap-2">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-[135deg]">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={circumference * 0.25} strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 6px ${strokeColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-heading font-bold ${status === 'danger' ? 'animate-pulse-vital text-danger' : status === 'warning' ? 'text-warning' : ''}`} style={status === 'normal' ? { color: strokeColor } : undefined}>
            {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">{unit}</span>
        </div>
      </div>
      {status === 'danger' && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
        </div>
      )}
    </div>
  );
});

VitalGauge.displayName = 'VitalGauge';
export default VitalGauge;
