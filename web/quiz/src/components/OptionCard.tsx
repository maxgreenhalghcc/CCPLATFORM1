import type { KeyboardEvent, ReactNode } from 'react';
import classNames from 'classnames';

interface OptionCardProps {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export default function OptionCard({
  label,
  description,
  selected = false,
  onClick,
  onKeyDown,
  icon,
  disabled = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      className={classNames(
        'option-card',
        selected ? 'option-card--selected' : undefined,
        disabled ? 'option-card--disabled' : undefined,
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-pressed={selected}
      disabled={disabled}
    >
      {icon ? <span className="option-card__icon" aria-hidden>{icon}</span> : null}
      <span className="option-card__label">{label}</span>
      {description ? <span className="option-card__description">{description}</span> : null}
    </button>
  );
}
