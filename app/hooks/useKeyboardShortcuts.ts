import { useEffect } from "react";

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    callback: (e: KeyboardEvent) => void;
    preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            shortcuts.forEach((shortcut) => {
                const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey;
                const metaMatches = shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey;
                const shiftMatches = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;

                if (keyMatches && ctrlMatches && metaMatches && shiftMatches) {
                    if (shortcut.preventDefault) {
                        e.preventDefault();
                    }
                    shortcut.callback(e);
                }
            });
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [shortcuts, enabled]);
}
