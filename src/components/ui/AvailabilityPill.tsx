import './AvailabilityPill.css';

interface AvailabilityPillProps {
  text: string;
  className?: string;
}

export function AvailabilityPill({ text, className = '' }: AvailabilityPillProps) {
  return (
    <div className={`availability-pill ${className}`}>
      <span className="availability-pill__status" aria-hidden="true">
        <span className="availability-pill__ping" />
        <span className="availability-pill__dot" />
      </span>
      <span className="availability-pill__text">{text}</span>
    </div>
  );
}
