"use client";

import { signIn, signOut } from "next-auth/react";
import { LoginPageFormData } from "./types";

export async function authenticate(
    prevState: string | undefined,
    formData: LoginPageFormData,
) {
    try {
        console.log("Attempting sign in!");

        const result = await signIn("credentials", {
            redirect: false,
            email: formData.email,
            password: formData.password,
        });
        console.log(formData.email, formData.password, result);

        if (result?.error) {
            return { response: false, error: "Invalid credentials" };
        } else {
            return { response: true };
        }
    } catch (error) {
        if (error) {
            return { response: false, error: "Something went wrong" };
        }
        throw error;
    }
}

export async function logout() {
    try {
        await signOut({ redirect: false });
        return { success: true };
    } catch (error) {
        console.error("Failed to sign out:", error);
        return { success: false };
    }
}
