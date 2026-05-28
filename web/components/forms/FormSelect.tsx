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
        className="mb-1 flex items-center text-sm font-medium text-[var(--tge-governance-neutral-text)]"
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
              ? "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)]"
              : disabled
              ? "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-muted-text)]"
              : "border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] focus:border-[var(--tge-brand-green)] focus:ring-2 focus:ring-[var(--tge-governance-success-border)]"
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

        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--tge-governance-muted-text)]">
          ▼
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-[var(--tge-governance-danger-text)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
