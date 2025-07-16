// Enhanced Input Component - Vietnamese POS System 2025
import React, { useState, useCallback } from 'react';
import { Input as AntInput, InputProps } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import './Input.css';

export interface EnhancedInputProps extends InputProps {
  variant?: 'default' | 'filled' | 'outlined' | 'borderless' | 'vietnamese';
  rounded?: boolean;
  glowing?: boolean;
  animated?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  shadowLevel?: 'none' | 'sm' | 'md' | 'lg';
  vietnameseStyle?: boolean;
  currencyMode?: boolean;
  phoneMode?: boolean;
  floatingLabel?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
}

const Input: React.FC<EnhancedInputProps> = ({
  variant = 'default',
  rounded = false,
  glowing = false,
  animated = false,
  fullWidth = true,
  compact = false,
  shadowLevel = 'none',
  vietnameseStyle = false,
  currencyMode = false,
  phoneMode = false,
  floatingLabel = false,
  label,
  helperText,
  errorText,
  successText,
  className,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Currency formatting for Vietnamese
    if (currencyMode) {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue) {
        newValue = new Intl.NumberFormat('vi-VN').format(parseInt(newValue));
      }
    }
    
    // Phone number formatting for Vietnamese
    if (phoneMode) {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 10) {
        newValue = newValue.slice(0, 10);
      }
    }
    
    setInternalValue(newValue);
    
    // Create a new event with formatted value
    const event = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    };
    
    onChange?.(event as React.ChangeEvent<HTMLInputElement>);
  }, [currencyMode, phoneMode, onChange]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const inputClasses = [
    'enhanced-input',
    `enhanced-input-${variant}`,
    rounded && 'enhanced-input-rounded',
    glowing && 'enhanced-input-glowing',
    animated && 'enhanced-input-animated',
    fullWidth && 'enhanced-input-full-width',
    compact && 'enhanced-input-compact',
    shadowLevel !== 'none' && `enhanced-input-shadow-${shadowLevel}`,
    vietnameseStyle && 'enhanced-input-vietnamese',
    currencyMode && 'enhanced-input-currency',
    phoneMode && 'enhanced-input-phone',
    floatingLabel && 'enhanced-input-floating-label',
    focused && 'enhanced-input-focused',
    errorText && 'enhanced-input-error',
    successText && 'enhanced-input-success',
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'enhanced-input-container',
    floatingLabel && 'enhanced-input-container-floating',
    focused && 'enhanced-input-container-focused',
    errorText && 'enhanced-input-container-error',
    successText && 'enhanced-input-container-success'
  ].filter(Boolean).join(' ');

  const inputProps = {
    ...props,
    className: inputClasses,
    type: type === 'password' && showPassword ? 'text' : type,
    value: internalValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder: floatingLabel ? '' : props.placeholder
  };

  const renderInput = () => {
    if (type === 'password') {
      return (
        <AntInput.Password
          {...inputProps}
          iconRender={(visible) => (
            <span 
              className="enhanced-input-password-icon"
              onClick={togglePasswordVisibility}
            >
              {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            </span>
          )}
        />
      );
    }
    
    return <AntInput {...inputProps} />;
  };

  if (floatingLabel) {
    return (
      <div className={containerClasses}>
        {renderInput()}
        {label && (
          <label className="enhanced-input-floating-label-text">
            {label}
          </label>
        )}
        {helperText && (
          <div className="enhanced-input-helper-text">
            {helperText}
          </div>
        )}
        {errorText && (
          <div className="enhanced-input-error-text">
            {errorText}
          </div>
        )}
        {successText && (
          <div className="enhanced-input-success-text">
            {successText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {label && (
        <label className="enhanced-input-label">
          {label}
        </label>
      )}
      {renderInput()}
      {helperText && (
        <div className="enhanced-input-helper-text">
          {helperText}
        </div>
      )}
      {errorText && (
        <div className="enhanced-input-error-text">
          {errorText}
        </div>
      )}
      {successText && (
        <div className="enhanced-input-success-text">
          {successText}
        </div>
      )}
    </div>
  );
};

export default Input;