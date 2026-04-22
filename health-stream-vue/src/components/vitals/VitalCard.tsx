import { memo } from 'react';
import { type VitalStatus } from '@/stores/vitalsStore';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  status: VitalStatus;
  icon: React.ReactNode;
  colorVar: string;
}

const VitalCard = memo(({ label, value, unit, status, icon, colorVar }: VitalCardProps) => {
  return (
    <div className={`glass-card p-4 relative overflow-hidden ${status === 'danger' ? 'ring-2 ring-danger/50' : ''}`}>
      {status === 'danger' && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: `hsl(var(${colorVar}))` }}>{icon}</span>
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-heading font-bold ${status === 'danger' ? 'text-danger animate-pulse-vital' : status === 'warning' ? 'text-warning' : ''}`}
          style={status === 'normal' ? { color: `hsl(var(${colorVar}))` } : undefined}
        >
          {value}
        </span>
        <span className="text-sm font-mono text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
});

VitalCard.displayName = 'VitalCard';
export default VitalCard;
