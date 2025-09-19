import LoginForm from "../components/login/login-form";

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center h-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <LoginForm />
            </div>
        </main>
    );
}
