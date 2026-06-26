
import { useId, useState } from 'react';

interface InputProps {
  value: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  setValue: (value: string) => void;
  name?: string;
  required?: boolean;
}

export default function Input({ value, setValue, label, type = 'text', name, required = true }: InputProps) {
  const reactId = useId();
  const inputId = name ?? `${label.replace(/\s+/g, '-').toLowerCase()}-${reactId}`;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isFilled = value.trim().length > 0;
  const isPassword = type === 'password';
  const shouldFloat = isFocused || isFilled;

  return (
    <div className="relative w-full">
      <input
        id={inputId}
        name={name}
        type={isPassword && !showPassword ? 'password' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        aria-label={label}
        autoComplete={type === 'password' ? 'current-password' : undefined}
      />

      <label
        htmlFor={inputId}
        className={`${shouldFloat ? '' : ''}`}>
        {label}
      </label>

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={showPassword}
        >
        </button>
      )}
    </div>
  );
}