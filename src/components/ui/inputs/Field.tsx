import type { ReactNode } from 'react';

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

/** Lightweight label + hint wrapper. Pair with any of the inputs in this folder. */
export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="zui-field">
      {label && (
        <label className="zui-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <p className="zui-field__hint">{hint}</p>}
    </div>
  );
}
