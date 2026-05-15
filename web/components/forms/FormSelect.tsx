import type { SelectOption } from "@/lib/options/shared";
import FieldHelp from "@/components/ui/FieldHelp";

type FormSelectProps = {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  helpText?: string;
  error?: string;
};

export default function FormSelect({
  label,
  name,
  value,
  options,
  onChange,
  disabled = false,
  helpText,
  error,
}: FormSelectProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 flex items-center text-sm font-medium text-gray-700"
      >
        <span>{label}</span>
        {helpText ? <FieldHelp title={label} content={helpText} /> : null}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none rounded-none border px-3 py-2 pr-8 text-sm leading-[1.25rem] outline-none ${
            error
              ? "border-red-500 bg-red-50"
              : disabled
              ? "border-gray-300 bg-gray-100 text-gray-500"
              : "border-gray-300 bg-white focus:border-[#8dc63f] focus:ring-2 focus:ring-[#dff0bf]"
          }`}
        >
          {options.map((option) => (
            <option
              key={`${name}-${option.value || "blank"}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          ▼
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}