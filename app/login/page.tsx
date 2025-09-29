import { Suspense } from "react";
import LoginForm from "../components/login/login-form";

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center h-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
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
