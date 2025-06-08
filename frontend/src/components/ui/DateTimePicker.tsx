import React, { forwardRef } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  type?: 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(({
  value,
  onChange,
  type = 'datetime-local',
  placeholder,
  min,
  max,
  className = '',
  id,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const getIcon = () => {
    switch (type) {
      case 'date':
        return <Calendar className="h-5 w-5" />;
      case 'time':
        return <Clock className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (type) {
      case 'date':
        return 'Select date';
      case 'time':
        return 'Select time';
      case 'datetime-local':
        return 'Select date and time';
      default:
        return 'Select date and time';
    }
  };

  return (
    <div className="datetime-picker-container">
      <div className="datetime-picker-input-wrapper">
        <input
          ref={ref}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={getPlaceholder()}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`datetime-picker-input ${className}`}
          id={id}
          {...props}
        />
        {/* Make icon clickable to focus input */}
        <div
          className="datetime-picker-icon"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            if (ref && typeof ref !== 'function' && ref?.current) {
              ref.current.focus();
            } else {
              // fallback: focus by id
              if (id) {
                const el = document.getElementById(id);
                if (el) el.focus();
              }
            }
          }}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          {getIcon()}
        </div>
      </div>
    </div>
  );
});

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;
