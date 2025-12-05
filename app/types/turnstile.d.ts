// Cloudflare Turnstile type definitions
declare global {
    interface Window {
        turnstile?: {
            render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
            execute: (container: string | HTMLElement, options?: TurnstileRenderOptions) => void;
            getResponse: (widgetId: string) => string | undefined;
        };
    }
}

interface TurnstileRenderOptions {
    sitekey: string;
    callback: (token: string) => void;
    "error-callback"?: () => void;
    "expired-callback"?: () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
    execution?: "render" | "execute"; // execute = manual trigger
    appearance?: "always" | "execute" | "interaction-only"; // execute = invisible until triggered
}

export {};
