import NextAuth from "next-auth";
import { AdapterUser } from "next-auth/adapters";

export declare module "next-auth" {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        email_verified: boolean;
    }

    interface Session {
        user: User;
    }

    interface JWT {
        role: string; // Define the role type in the JWT
    }
}
