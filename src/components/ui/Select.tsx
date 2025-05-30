import React, { forwardRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  id,
  disabled = false,
  required = false,
  searchable = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="select-container">
      {/* Hidden native select for form submission */}
      <select
        ref={ref}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="sr-only"
        id={id}
        required={required}
        disabled={disabled}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select UI */}
      <div className={`select-wrapper ${disabled ? 'disabled' : ''} ${className}`}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="select-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`select-chevron ${isOpen ? 'rotate' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <>
            <div className="select-backdrop" onClick={() => setIsOpen(false)} />
            <div className="select-dropdown">
              {searchable && (
                <div className="select-search">
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="select-search-input"
                    autoFocus
                  />
                </div>
              )}
              
              <div className="select-options">
                {filteredOptions.length === 0 ? (
                  <div className="select-no-options">No options found</div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      className={`select-option ${value === option.value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                      disabled={option.disabled}
                    >
                      <div className="select-option-content">
                        <span className="select-option-label">{option.label}</span>
                        {option.description && (
                          <span className="select-option-description">{option.description}</span>
                        )}
                      </div>
                      {value === option.value && (
                        <Check className="select-option-check" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
