import { Suspense } from "react";
import LoginForm from "../components/login/login-form";

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#083157] to-[#064580]">
            <div className="mx-auto flex w-full max-w-[500px] flex-col p-4">
                <Suspense fallback={
                    <div className="text-center text-white">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                }>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}
