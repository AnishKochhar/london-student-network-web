import React from "react";
import Link from "next/link";
import { Button } from "@/app/components/button";


export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center px-6">
      <h1 className="text-9xl font-bold text-red-500">404</h1>
      <p className="mt-4 text-lg text-gray-400">Oops, resource not found</p>
            <Button
        variant="filled"
        className="mt-6 bg-red-500 hover:bg-red-600 focus:ring-red-400"
        asChild
      >
        <Link href="/" passHref>
          Go Home
        </Link>
      </Button>
    </div>
  );
};
