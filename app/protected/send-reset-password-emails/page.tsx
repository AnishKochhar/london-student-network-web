"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Correct import for Next.js 13 app directory
import toast from "react-hot-toast";

export default function SendResetPasswordEmails() {
    const router = useRouter();

    useEffect(() => {
        const sendEmails = async () => {
            try {
                const response = await fetch(
                    "/api/protected/password-reset-requested",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                    },
                );

                if (!response.ok) {
                    if (response.status === 403) {
                        toast.error(
                            "Forbidden: You do not have permission to perform this action.",
                        );
                        console.log(response);
                    } else {
                        toast.error(
                            "An error occurred during attempt to call protected route",
                        );
                    }
                    return;
                }

                toast.success("Emails sent!");
                router.push("/");
            } catch (error) {
                console.error("Error sending emails:", error);
                toast.error(
                    error.message || "An error occurred during email sending.",
                ); // Display error message from server or a generic message
                return;
            }
        };

        sendEmails();
    }, [router]);

    return <div>Authenticating...</div>; // Or a loading indicator
}
