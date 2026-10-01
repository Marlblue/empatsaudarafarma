export function FormField({
  label,
  name,
  error,
  hint,
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
      <input name={name} className="input" {...props} />
      {hint && !error && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
