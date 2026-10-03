import { PasswordInput } from "@/components/password-input";

export function FormField({
  label,
  name,
  error,
  hint,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {type === "password" ? (
        <PasswordInput name={name} {...props} />
      ) : (
        <input name={name} type={type} className="input" {...props} />
      )}
      {hint && !error && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
