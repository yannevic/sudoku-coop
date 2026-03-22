import React from 'react';

type CustomInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    labelClassName?: string;
    wrapperClassName?: string;
    isTextarea?: boolean;
  };

const CustomInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, CustomInputProps>(
  (
    { label, labelClassName, wrapperClassName, className, id, required, isTextarea, ...props },
    ref
  ) => {
    const inputId = id || `custom-input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    const sharedClasses = `border-2 rounded-[5px] focus:outline-2 focus:border-[#82AADE] focus:outline-[#82AADE] focus:rounded-[5px] p-2 w-[650px] ${className || ''}`;

    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName || ''}`}>
        <label htmlFor={inputId} className={`text-base font-medium ${labelClassName || ''}`}>
          {label}
          {required && <span className="text-base font-medium text-[#82AADE]"> *</span>}
        </label>

        {isTextarea ? (
          <textarea
            id={inputId}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={sharedClasses}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            ref={ref as React.Ref<HTMLInputElement>}
            className={sharedClasses}
            {...props}
          />
        )}
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';

export default CustomInput;
