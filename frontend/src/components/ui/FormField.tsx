import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  label,
  error,
  success,
  hint,
  required = false,
  children,
  className = '',
  id
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div ref={ref} className={`form-field-container ${className}`}>
      <div className="form-field-header">
        <label htmlFor={fieldId} className="form-field-label">
          {label}
          {required && <span className="form-field-required">*</span>}
        </label>
        {hint && (
          <div className="form-field-hint-trigger" title={hint}>
            <Info className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className="form-field-input-container">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          className: `form-field-input ${error ? 'error' : ''} ${success ? 'success' : ''} ${(children as React.ReactElement).props.className || ''}`
        })}
        
        {/* Status Icons */}
        <div className="form-field-status-icon">
          {error && <AlertCircle className="h-5 w-5 text-red-500" />}
          {success && !error && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
      </div>

      {/* Messages */}
      <div className="form-field-messages">
        {error && (
          <div className="form-field-error">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="form-field-success">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}
        {hint && !error && !success && (
          <div className="form-field-hint">
            <Info className="h-4 w-4" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
