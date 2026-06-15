// colorthief ships no type declarations; provide a minimal one for the
// methods we use so the import isn't implicitly `any`.
declare module "colorthief" {
    export default class ColorThief {
        getColor(
            img: HTMLImageElement | null,
            quality?: number,
        ): [number, number, number];
        getPalette(
            img: HTMLImageElement | null,
            colorCount?: number,
            quality?: number,
        ): Array<[number, number, number]>;
    }
}
