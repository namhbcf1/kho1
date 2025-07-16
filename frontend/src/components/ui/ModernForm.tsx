/**
 * Modern Form Component with Enhanced UX
 * Fixes: Basic form components, poor validation feedback
 * Implements: Advanced form features, real-time validation, modern styling
 */

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Slider, 
  Rate, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Divider, 
  Card, 
  Steps, 
  Progress,
  Tooltip,
  Alert
} from 'antd';
import { 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  InfoCircleOutlined, 
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'switch' | 'slider' | 'rate' | 'upload' | 'phone' | 'currency';
  required?: boolean;
  placeholder?: string;
  tooltip?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
  dependencies?: string[];
  conditional?: (values: any) => boolean;
  transform?: (value: any) => any;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  autoComplete?: string;
}

export interface ModernFormProps {
  fields: FormFieldConfig[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  layout?: 'horizontal' | 'vertical' | 'inline';
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  readonly?: boolean;
  showProgress?: boolean;
  showSteps?: boolean;
  stepConfig?: Array<{ title: string; description?: string; fields: string[] }>;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  validateOnChange?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

export const ModernForm: React.FC<ModernFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onValuesChange,
  layout = 'vertical',
  size = 'middle',
  loading = false,
  readonly = false,
  showProgress = false,
  showSteps = false,
  stepConfig = [],
  submitText = 'Submit',
  resetText = 'Reset',
  showReset = true,
  validateOnChange = true,
  autoSave = false,
  autoSaveInterval = 5000,
  theme = 'light',
  className = '',
  style = {}
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [formValues, setFormValues] = useState(initialValues);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && autoSaveInterval > 0) {
      const interval = setInterval(() => {
        const values = form.getFieldsValue();
        if (Object.keys(values).length > 0) {
          setAutoSaveStatus('saving');
          // Simulate auto-save
          setTimeout(() => {
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
          }, 1000);
        }
      }, autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [autoSave, autoSaveInterval, form]);

  // Calculate form progress
  useEffect(() => {
    if (showProgress) {
      const totalFields = fields.filter(field => !field.hidden).length;
      const filledFields = Object.values(formValues).filter(value => 
        value !== undefined && value !== null && value !== ''
      ).length;
      setFormProgress(Math.round((filledFields / totalFields) * 100));
    }
  }, [formValues, fields, showProgress]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field validation
  const handleFieldValidation = (field: FormFieldConfig, value: any) => {
    if (!field.validation) return null;

    const { min, max, pattern, message } = field.validation;
    
    if (min !== undefined && value && value.length < min) {
      return `Minimum ${min} characters required`;
    }
    
    if (max !== undefined && value && value.length > max) {
      return `Maximum ${max} characters allowed`;
    }
    
    if (pattern && value && !pattern.test(value)) {
      return message || 'Invalid format';
    }
    
    return null;
  };

  // Handle values change
  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
    
    // Real-time validation
    if (validateOnChange) {
      const errors: Record<string, string> = {};
      Object.keys(changedValues).forEach(fieldName => {
        const field = fields.find(f => f.name === fieldName);
        if (field) {
          const error = handleFieldValidation(field, changedValues[fieldName]);
          if (error) {
            errors[fieldName] = error;
          }
        }
      });
      setFieldErrors(prev => ({ ...prev, ...errors }));
    }
    
    onValuesChange?.(changedValues, allValues);
  };

  // Render form field based on type
  const renderField = (field: FormFieldConfig) => {
    if (field.hidden) return null;
    
    const { name, label, type, required, placeholder, tooltip, options, disabled, defaultValue } = field;
    
    const fieldProps = {
      placeholder,
      disabled: disabled || readonly,
      size,
      style: { width: '100%' }
    };

    const renderFieldInput = () => {
      switch (type) {
        case 'text':
        case 'email':
          return (
            <Input 
              {...fieldProps} 
              type={type}
              autoComplete={field.autoComplete}
            />
          );
        
        case 'password':
          return (
            <Input.Password 
              {...fieldProps}
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          );
        
        case 'number':
          return (
            <InputNumber 
              {...fieldProps}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          );
        
        case 'currency':
          return (
            <InputNumber 
              {...fieldProps}
              prefix="₫"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          );
        
        case 'phone':
          return (
            <Input 
              {...fieldProps}
              addonBefore="+84"
              type="tel"
            />
          );
        
        case 'textarea':
          return (
            <TextArea 
              {...fieldProps}
              rows={4}
              showCount
              maxLength={field.validation?.max}
            />
          );
        
        case 'select':
          return (
            <Select 
              {...fieldProps}
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {options?.map(option => (
                <Option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </Option>
              ))}
            </Select>
          );
        
        case 'date':
          return (
            <DatePicker 
              {...fieldProps}
              format="DD/MM/YYYY"
            />
          );
        
        case 'switch':
          return (
            <Switch 
              disabled={disabled || readonly}
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
            />
          );
        
        case 'slider':
          return (
            <Slider 
              disabled={disabled || readonly}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              marks={field.validation?.max ? {
                0: '0',
                [field.validation.max]: `${field.validation.max}`
              } : undefined}
            />
          );
        
        case 'rate':
          return (
            <Rate 
              disabled={disabled || readonly}
              allowHalf
              count={5}
            />
          );
        
        case 'upload':
          return (
            <Upload 
              disabled={disabled || readonly}
              listType="text"
              beforeUpload={() => false}
            >
              <Button 
                icon={<UploadOutlined />}
                disabled={disabled || readonly}
              >
                Upload File
              </Button>
            </Upload>
          );
        
        default:
          return <Input {...fieldProps} />;
      }
    };

    const labelWithTooltip = (
      <Space>
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        )}
      </Space>
    );

    return (
      <Form.Item
        key={name}
        name={name}
        label={labelWithTooltip}
        required={required}
        validateStatus={fieldErrors[name] ? 'error' : ''}
        help={fieldErrors[name]}
        rules={[
          {
            required,
            message: `Please input ${label.toLowerCase()}`
          }
        ]}
      >
        {renderFieldInput()}
      </Form.Item>
    );
  };

  // Render step navigation
  const renderStepNavigation = () => {
    if (!showSteps || stepConfig.length === 0) return null;
    
    const nextStep = () => {
      if (currentStep < stepConfig.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    };
    
    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };
    
    return (
      <div className="form-step-navigation">
        <Steps 
          current={currentStep} 
          size="small"
          style={{ marginBottom: 24 }}
        >
          {stepConfig.map((step, index) => (
            <Step 
              key={index}
              title={step.title}
              description={step.description}
            />
          ))}
        </Steps>
        
        <div className="step-actions">
          <Space>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < stepConfig.length - 1 && (
              <Button type="primary" onClick={nextStep}>
                Next
              </Button>
            )}
            {currentStep === stepConfig.length - 1 && (
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isSubmitting}
                icon={<SaveOutlined />}
              >
                {submitText}
              </Button>
            )}
          </Space>
        </div>
      </div>
    );
  };

  // Get fields for current step
  const getCurrentStepFields = () => {
    if (!showSteps || stepConfig.length === 0) return fields;
    
    const currentStepFieldNames = stepConfig[currentStep]?.fields || [];
    return fields.filter(field => currentStepFieldNames.includes(field.name));
  };

  // Render auto-save status
  const renderAutoSaveStatus = () => {
    if (!autoSave) return null;
    
    const statusConfig = {
      idle: { color: '#8c8c8c', text: '' },
      saving: { color: '#1890ff', text: 'Saving...' },
      saved: { color: '#52c41a', text: 'Saved' },
      error: { color: '#ff4d4f', text: 'Save failed' }
    };
    
    const { color, text } = statusConfig[autoSaveStatus];
    
    return text ? (
      <div className="auto-save-status">
        <Text style={{ color, fontSize: '12px' }}>
          {text}
        </Text>
      </div>
    ) : null;
  };

  return (
    <Card 
      className={`modern-form ${theme === 'dark' ? 'dark-theme' : ''} ${className}`}
      style={style}
      bordered={false}
    >
      {/* Form Progress */}
      {showProgress && (
        <div className="form-progress">
          <Progress 
            percent={formProgress} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            showInfo={false}
            size="small"
          />
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
            {formProgress}% Complete
          </Text>
        </div>
      )}

      {/* Auto-save Status */}
      {renderAutoSaveStatus()}

      <Form
        form={form}
        layout={layout}
        size={size}
        initialValues={initialValues}
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        preserve={false}
      >
        {/* Form Fields */}
        <div className="form-fields">
          {getCurrentStepFields().map(renderField)}
        </div>

        {/* Step Navigation or Form Actions */}
        {showSteps ? renderStepNavigation() : (
          <div className="form-actions">
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={isSubmitting || loading}
                icon={<SaveOutlined />}
                size={size}
              >
                {submitText}
              </Button>
              {showReset && (
                <Button 
                  onClick={() => form.resetFields()}
                  disabled={loading}
                  icon={<ReloadOutlined />}
                  size={size}
                >
                  {resetText}
                </Button>
              )}
            </Space>
          </div>
        )}
      </Form>

      {/* Form Styles */}
      <style jsx>{`
        .modern-form {
          border-radius: 12px;
          padding: 24px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .dark-theme {
          background: #1f1f1f;
          color: #ffffff;
        }

        .form-progress {
          margin-bottom: 24px;
          text-align: center;
        }

        .auto-save-status {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
        }

        .form-fields {
          margin-bottom: 24px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .dark-theme .form-actions {
          border-color: #434343;
        }

        .form-step-navigation {
          margin-top: 24px;
        }

        .step-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .dark-theme .step-actions {
          border-color: #434343;
        }

        /* Field enhancements */
        :global(.ant-form-item-label) {
          font-weight: 500;
        }

        :global(.ant-input),
        :global(.ant-input-number),
        :global(.ant-select-selector),
        :global(.ant-picker) {
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        :global(.ant-input:focus),
        :global(.ant-input-number:focus),
        :global(.ant-select-focused .ant-select-selector),
        :global(.ant-picker:focus) {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        :global(.ant-form-item-has-error .ant-input),
        :global(.ant-form-item-has-error .ant-input-number),
        :global(.ant-form-item-has-error .ant-select-selector),
        :global(.ant-form-item-has-error .ant-picker) {
          border-color: #ff4d4f;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .modern-form {
            padding: 16px;
          }

          .form-actions,
          .step-actions {
            justify-content: center;
          }

          :global(.ant-form-item) {
            margin-bottom: 16px;
          }
        }

        /* Animation */
        .form-fields {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Accessibility */
        :global(.ant-form-item-required) {
          position: relative;
        }

        :global(.ant-form-item-required::before) {
          content: '*';
          color: #ff4d4f;
          margin-right: 4px;
        }
      `}</style>
    </Card>
  );
};

export default ModernForm;