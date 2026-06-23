export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  optional = false,
  hint,
  icon: Icon,
  disabled = false,
  maxLength,
  min,
  max
}) {
  const showError = touched && error;
  
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {/* Label */}
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
        {optional && (
          <span className="text-gray-400 ml-1 font-normal text-xs">(optional)</span>
        )}
      </label>
      
      {/* Input wrapper */}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          onBlur={() => onBlur && onBlur(name)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          className={`
            w-full px-3 py-2.5 rounded-lg border text-sm transition-colors text-black placeholder-gray-400
            focus:outline-none focus:ring-2
            ${Icon ? "pl-9" : ""}
            ${showError
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:ring-indigo-200 focus:border-indigo-400"
            }
            ${disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
              : "bg-white"
            }
          `}
        />
      </div>
      
      {/* Error message */}
      {showError && (
        <p className="text-red-500 text-xs flex items-center gap-1 mt-0.5">
          <span>⚠</span>
          {error}
        </p>
      )}
      
      {/* Hint text (no error) */}
      {hint && !showError && (
        <p className="text-gray-400 text-xs mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
}
