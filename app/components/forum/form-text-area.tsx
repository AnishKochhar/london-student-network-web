"use client";

interface FormTextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    disabled?: boolean;
}

export default function FormTextarea({
    label,
    value,
    onChange,
    placeholder = "",
    rows = 4,
    required = false,
    disabled = false,
}: FormTextareaProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                required={required}
                disabled={disabled}
            />
        </div>
    );
}
