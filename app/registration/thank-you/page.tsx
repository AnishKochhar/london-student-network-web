"use client"

export default function RegistrationSuccesfullThankYouPage({ searchParams }: { searchParams: any }) {
    return (


        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-blue-600">
                    Please check your email for confirmation and your tickets. 
                </h2>
                <h2 className="text-2xl font-semibold text-blue-600">
                    Don't forget to check your junk inbox as well.
                </h2>
                <div className="mt-4 flex justify-center">
                </div>
            </div>
        </div>
    );
}

