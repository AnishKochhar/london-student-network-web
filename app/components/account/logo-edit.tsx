"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../../components/button";
import Image from "next/image";
import { ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { OrganiserAccountEditFormData } from "@/app/lib/types";

const ImageUpload = ({
    id,
    register,
    setValue,
}: {
    id: string;
    register: UseFormRegister<OrganiserAccountEditFormData>;
    setValue: UseFormSetValue<OrganiserAccountEditFormData>;
}) => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchAccountLogo = useCallback(
        async (id: string) => {
            try {
                const res = await fetch("/api/user/get-account-logo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(id),
                });
                const { logo_url } = await res.json();
                setPreviewImage(logo_url);
                console.log("logo_url: ", logo_url);
                setValue("imageUrl", logo_url);
            } catch (error) {
                console.error("Error loading logo:", error);
            }
        },
        [setPreviewImage, setValue],
    );

    useEffect(() => {
        fetchAccountLogo(id);
    }, [id, fetchAccountLogo]);

    register("uploadedImage");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        inputRef.current?.click();
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImage(file);
            setValue("uploadedImage", file);
            setPreviewImage(URL.createObjectURL(file)); // Generate image preview
        }
    };

    const clearUploadedImage = () => {
        setUploadedImage(null);
        setValue("uploadedImage", null);
        setPreviewImage(null); // Clear preview
    };

    return (
        <div className="flex flex-col items-center">
            {/* Upload Button */}
            <button
                className="flex flex-row self-start my-2 w-fit px-4 items-center font-light text-white border border-gray-300 hover:bg-gray-200 rounded-sm text-sm h-10"
                onClick={handleButtonClick}
            >
                <ArrowUpTrayIcon width={15} height={15} className="mr-2" />{" "}
                Upload your logo here
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
            />

            {/* Clear Button */}
            {uploadedImage && (
                <Button
                    variant="ghost"
                    className="self-start text-sm text-red-600 hover:text-red-900"
                    onClick={clearUploadedImage}
                >
                    <TrashIcon width={10} height={10} className="mr-1" />
                    Clear uploaded logo
                </Button>
            )}

            {/* Image Preview */}
            <div className="relative self-start w-[100px] h-[100px] border border-black overflow-hidden">
                <Image
                    src={previewImage || "/images/no-image-found.png"}
                    alt="Your Logo"
                    fill
                    className="w-[90%] h-64 object-cover border-2 border-black/70"
                />
            </div>
        </div>
    );
};

export default ImageUpload;
