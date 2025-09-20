import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant: "outline" | "filled" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    onClick?: () => void;
}

export function Button({
    variant,
    size = "md",
    disabled,
    onClick,
    children,
    className,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            className={clsx(
                "flex items-center rounded-lg px-4 text-sm font-light transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
                {
                    "bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600 focus-visible:outline-blue-500":
                        variant === "filled",
                    "border border-blue-500 text-blue-500 hover:bg-blue-100 active:bg-blue-200 focus-visible:outline-blue-500":
                        variant === "outline",
                    "text-#[a3a3a3] hover:cursor-pointer hover:text-gray-100":
                        variant === "ghost",
                },
                {
                    "h-8 text-xs": size === "sm",
                    "h-10 text-sm": size === "md",
                    "h-12 text-lg": size === "lg",
                },
                {
                    "cursor-not-allowed opacity-50": disabled,
                },
                className,
            )}
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
        >
            <span className="flex items-center justify-center w-full h-full shrink-0">
                {children}
            </span>
        </button>
    );
}
