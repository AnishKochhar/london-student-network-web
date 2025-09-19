import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import type { User } from "./app/lib/types";
import bcrypt from "bcrypt";

async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
        return user.rows[0];
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/login",
        signOut: "/logout",
    },
    session: {
        strategy: "jwt",
        maxAge: 1 * 24 * 60 * 60, // 1 day
    },
    providers: [
        Credentials({
            async authorize(credentials, req) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials);
                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    const passwordCorrect = await bcrypt.compare(
                        password,
                        user.password,
                    );

                    if (passwordCorrect) return user;
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                // token.email_verified = !!user.email_verified;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id =
                String(token?.id) || "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c"; // admin uid
            session.user.role = String(token?.role) || "No role found";
            session.user.name = token?.name || "No name found";

            return session;
        },
    },
    secret: process.env.AUTH_SECRET,
});
