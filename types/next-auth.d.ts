import NextAuth from "next-auth";
import { AdapterUser } from "next-auth/adapters";

export declare module "next-auth" {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        email_verified: boolean;
        verified_university?: string | null;
    }

    interface Session {
        user: User & {
            // Single field for authorization: verified university
            // null = unverified or no university email
            // string = verified university code (e.g., "imperial", "ucl")
            verified_university: string | null;
        };
    }

    interface JWT {
        role: string;
        // Single field for authorization
        verified_university?: string | null;
    }
}
