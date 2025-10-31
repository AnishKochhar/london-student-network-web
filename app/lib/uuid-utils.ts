const BASE62_CHARS =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// currently the best solution is to use base62, which can make the uuid 22 digits shortest
// so we clip only the 20 numbers of the 32-digit uuid-v4, it should not have any conflict until 100000 activities(or maybe I am wrong)

export function base16ToBase62(hex: string): string {
    const last20Hex = hex.replace(/-/g, "").slice(-20); // Get the last 20 hex digits
    let bigInt = BigInt(`0x${last20Hex}`);

    let base62 = "";
    while (bigInt > 0) {
        const remainder = Number(bigInt % BigInt(62));
        base62 = BASE62_CHARS[remainder] + base62;
        bigInt = bigInt / BigInt(62);
    }

    return base62;
}

export function base62ToBase16(base62: string): string {
    let bigInt = BigInt(0);
    for (const char of base62) {
        bigInt = bigInt * BigInt(62) + BigInt(BASE62_CHARS.indexOf(char));
    }

    const hex = bigInt.toString(16).padStart(20, "0");
    const formattedHex = hex.toLowerCase();

    // Return partial UUID (last 20 hex chars formatted)
    // This is used with LIKE '%partial_uuid' queries in fetchEventById
    return `${formattedHex.slice(0, 4)}-${formattedHex.slice(4, 8)}-${formattedHex.slice(8)}`;
}

// EXAMPLE USAGE
// ------------------------------------------------------------------------
// const uuid = '123e4567-e89b-12d3-a456-426614174000'; // Example UUID
// const base62 = base16ToBase62(last20Hex);
// console.log(`Last 20 Hex of UUID: ${last20Hex} -> Base62: ${base62}`);

// const hexBack = base62ToBase16(base62);
// console.log(`Base62: ${base62} -> Last 20 Hex of UUID: ${hexBack}`);
