import './GhostButton.css';

export type GhostButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface GhostButtonProps {
  text?: string;
  onClick?: () => void;
  className?: string;
  size?: GhostButtonSize;
}

export function GhostButton({
  text = 'Learn more',
  onClick,
  className = '',
  size = 'sm',
}: GhostButtonProps) {
  return (
    <button
      className={`ghost-button ghost-button--${size} ${className}`}
      onClick={onClick}
    >
      <span className="ghost-button__content">
        <span className="ghost-button__text">{text}</span>
      </span>
    </button>
  );
}