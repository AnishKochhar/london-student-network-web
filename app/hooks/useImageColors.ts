"use client";

import { useState, useEffect, useRef } from "react";
import ColorThief from "colorthief";

type RGB = [number, number, number];
type HSL = [number, number, number];

interface ColorResult {
    dominant: string;
    palette: string[];
    gradient: string;
    gradientRadial: string;
    gradientMesh: string;
    isLoading: boolean;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, "0")).join("");
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): RGB {
    h /= 360; s /= 100; l /= 100;

    if (s === 0) {
        const val = Math.round(l * 255);
        return [val, val, val];
    }

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [
        Math.round(hue2rgb(p, q, h + 1/3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1/3) * 255)
    ];
}

// Create a vibrant but not overwhelming background color
function createBackgroundColor(rgb: RGB): RGB {
    const [h, s, l] = rgbToHsl(...rgb);
    // Keep good saturation (70-85%), set lightness to be visible but not harsh (75-85%)
    const newS = Math.min(85, Math.max(50, s * 0.85));
    const newL = Math.min(85, Math.max(70, l > 50 ? 78 : 75));
    return hslToRgb(h, newS, newL);
}

// Create a deeper/richer version for gradient depth
function createDeepColor(rgb: RGB): RGB {
    const [h, s, l] = rgbToHsl(...rgb);
    // More saturated, darker
    const newS = Math.min(90, s * 1.1);
    const newL = Math.max(45, Math.min(65, l * 0.75));
    return hslToRgb(h, newS, newL);
}

// Create a light highlight color
function createHighlightColor(rgb: RGB): RGB {
    const [h, s, l] = rgbToHsl(...rgb);
    // Light, slightly desaturated
    const newS = Math.min(60, s * 0.6);
    const newL = Math.min(95, Math.max(88, l + 25));
    return hslToRgb(h, newS, newL);
}

// Get a complementary or analogous color for interest
function getAccentColor(rgb: RGB, paletteColors: RGB[]): RGB {
    // Try to find a contrasting color from the palette
    const [h1] = rgbToHsl(...rgb);

    for (const color of paletteColors) {
        const [h2, s2] = rgbToHsl(...color);
        const hueDiff = Math.abs(h1 - h2);
        // Look for colors with different hue and decent saturation
        if ((hueDiff > 30 && hueDiff < 330) && s2 > 20) {
            return createBackgroundColor(color);
        }
    }

    // Fallback: shift hue by 30 degrees for analogous color
    const [h, s, l] = rgbToHsl(...rgb);
    return hslToRgb((h + 30) % 360, Math.min(70, s), Math.min(80, l + 10));
}

export function useImageColors(imageUrl: string | null, enabled: boolean = true): ColorResult {
    const [colors, setColors] = useState<ColorResult>({
        dominant: "",
        palette: [],
        gradient: "",
        gradientRadial: "",
        gradientMesh: "",
        isLoading: true,
    });

    const colorThiefRef = useRef<ColorThief | null>(null);

    useEffect(() => {
        if (!enabled || !imageUrl) {
            setColors(prev => ({ ...prev, isLoading: false }));
            return;
        }

        // Initialize ColorThief once
        if (!colorThiefRef.current) {
            colorThiefRef.current = new ColorThief();
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            try {
                const colorThief = colorThiefRef.current!;

                // Get dominant color and palette
                const dominantRgb = colorThief.getColor(img) as RGB;
                const paletteRgb = colorThief.getPalette(img, 6) as RGB[];

                // Create color variations
                const bgColor = createBackgroundColor(dominantRgb);
                const deepColor = createDeepColor(dominantRgb);
                const highlightColor = createHighlightColor(dominantRgb);
                const accentColor = getAccentColor(dominantRgb, paletteRgb.slice(1));

                const bgHex = rgbToHex(...bgColor);
                const deepHex = rgbToHex(...deepColor);
                const highlightHex = rgbToHex(...highlightColor);
                const accentHex = rgbToHex(...accentColor);

                // Convert palette to hex (keeping them vibrant)
                const paletteHex = paletteRgb.map(rgb => rgbToHex(...createBackgroundColor(rgb)));

                setColors({
                    dominant: bgHex,
                    palette: paletteHex,

                    // Rich diagonal gradient with multiple stops for depth
                    gradient: `linear-gradient(145deg, ${highlightHex} 0%, ${bgHex} 35%, ${deepHex} 100%)`,

                    // Radial gradient creating a spotlight/glow effect
                    gradientRadial: `radial-gradient(ellipse at 20% 20%, ${highlightHex} 0%, ${bgHex} 50%, ${deepHex} 100%)`,

                    // Mesh-like gradient using multiple layers for rich depth
                    gradientMesh: `
                        radial-gradient(ellipse at 0% 0%, ${highlightHex}dd 0%, transparent 50%),
                        radial-gradient(ellipse at 100% 100%, ${accentHex}aa 0%, transparent 50%),
                        linear-gradient(160deg, ${bgHex} 0%, ${deepHex} 100%)
                    `.replace(/\s+/g, ' ').trim(),

                    isLoading: false,
                });
            } catch (error) {
                console.error("Error extracting colors:", error);
                setColors(prev => ({ ...prev, isLoading: false }));
            }
        };

        img.onerror = () => {
            console.error("Failed to load image for color extraction");
            setColors(prev => ({ ...prev, isLoading: false }));
        };

        img.src = imageUrl;
    }, [imageUrl, enabled]);

    return colors;
}
