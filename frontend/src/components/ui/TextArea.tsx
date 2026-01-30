import { forwardRef, useId } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './lib/utils';

export interface TextAreaProps extends ComponentPropsWithoutRef<'textarea'> {
  label?: string;
  error?: string;
  maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      error,
      maxLength,
      className,
      id: idProp,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    const currentLength =
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
          ? defaultValue.length
          : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          className={cn(
            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />

        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p id={`${id}-error`} className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          {maxLength != null && (
            <p
              className={cn(
                'ml-auto text-sm',
                currentLength >= maxLength ? 'text-red-600' : 'text-gray-500',
              )}
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);
