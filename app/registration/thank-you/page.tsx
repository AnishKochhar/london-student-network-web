"use client"

export default function RegistrationSuccesfullThankYouPage({ searchParams }: { searchParams: any }) {
    return (


        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-blue-600">
                    <p>Please check your email for confirmation - it may take a while to arrive.</p>
                    <p>Please use your confirmation email as your ticket.</p> <br></br>
                </h2>
                <h2 className="text-2xl font-semibold text-blue-600">
                    <p>Don't forget to check your junk inbox.</p>
                    <p>Thanks very much for your business.</p>
                </h2>
                <div className="mt-4 flex justify-center">
                </div>
            </div>
        </div>
    );
}

