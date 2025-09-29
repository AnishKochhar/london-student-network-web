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
        maxAge: 8 * 60 * 60, // 8 hours (reduced from 1 day)
        updateAge: 2 * 60 * 60, // Update session every 2 hours
    },
    jwt: {
        maxAge: 8 * 60 * 60, // 8 hours
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
        async jwt({ token, user, trigger, session }) {
            // Initial login - set user data in token and update last_login
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                token.loginTime = Date.now();

                // Update last_login in database
                try {
                    await sql`
                        UPDATE users
                        SET last_login = NOW()
                        WHERE id = ${user.id}
                    `;
                } catch (error) {
                    console.error("Failed to update last_login:", error);
                }
                // token.email_verified = !!user.email_verified;
            }

            // Check for session timeout (additional security)
            if (token.loginTime) {
                const sessionAge = Date.now() - (token.loginTime as number);
                const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

                if (sessionAge > maxSessionAge) {
                    // Force logout by returning null
                    return null;
                }
            }

            // Update last activity timestamp
            token.lastActivity = Date.now();

            return token;
        },
        async session({ session, token }) {
            if (!token) {
                return null; // Force logout if token is invalid
            }

            session.user.id = String(token?.id) || "";
            session.user.role = String(token?.role) || "";
            session.user.name = token?.name || "";
            // session.user.lastActivity = token?.lastActivity;

            return session;
        },
    },
    secret: process.env.AUTH_SECRET,
});
