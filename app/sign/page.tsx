import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

export default function SignPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#041A2E] via-[#064580] to-[#083157] text-white">
            <div className="flex flex-col md:flex-row items-center rounded-md w-full max-w-5xl">
                {/* Left Section */}
                <div className="flex flex-col items-center space-y-4 p-12">
                    <h2 className="text-3xl font-medium text-center pb-20">
                        Already got an account?
                    </h2>
                    <JoinButton href="/login" text="Sign in" />
                </div>

                {/* Divider */}
                <div className="w-2/3 h-0.5 md:w-0.5 md:h-96 bg-white mx-20"></div>

                {/* Right Section */}
                <div className="flex flex-col items-center space-y-4 p-12">
                    <h2 className="text-3xl font-medium text-center pb-20">
                        New to LSN?
                    </h2>

                    <JoinButton href="/register" text="Create an account" />
                </div>
            </div>
        </div>
    );
}

function JoinButton({
    text,
    className,
    href,
}: {
    text: string;
    className?: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className={clsx("flex items-center space-x-2 group", className)}
        >
            <div>
                <span className="relative text-lg font-medium flex items-center space-x-2 text-white">
                    {text}
                    <Image
                        src="/icons/arrow-right.svg"
                        alt="next"
                        width={20}
                        height={12}
                        className="h-4 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-2"
                    />
                </span>
                <span className="block w-full h-px bg-white mt-1"></span>
            </div>
        </Link>
    );
}
