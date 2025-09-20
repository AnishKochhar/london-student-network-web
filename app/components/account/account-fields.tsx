import { Button } from "../button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import fetchPredefinedTags from "@/app/lib/utils";

export default function AccountFields({
    id,
    role,
}: {
    id: string;
    role: string;
}) {
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [tags, setTags] = useState<number[]>([]);
    const [predefinedTags, setPredefinedTags] = useState([]);

    useEffect(() => {
        const fetchTags = async () => {
            const tags = await fetchPredefinedTags();
            setPredefinedTags(tags);
        };

        fetchTags();
    }, []);

    const fetchAccountInfo = async (id: string) => {
        try {
            const res = await fetch("/api/user/get-account-fields", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(id),
            });

            const { description, website, tags } = await res.json();
            setDescription(description);
            setWebsite(website);
            setTags(tags);
            console.log(description, website, tags);
        } catch (error) {
            console.error("Error loading description:", error);
        }
    };

    useEffect(() => {
        if (role === "organiser") {
            fetchAccountInfo(id);
        }
    }, [role, id]);

    const router = useRouter();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                </label>
                <div className="bg-white/10 rounded-lg px-4 py-3 text-white font-medium min-h-[80px]">
                    {description || "No description found"}
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                </label>
                <div className="bg-white/10 rounded-lg px-4 py-3 text-white font-medium">
                    {website ? (
                        <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 underline"
                        >
                            {website}
                        </a>
                    ) : (
                        "No website found"
                    )}
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                </label>
                <div className="bg-white/10 rounded-lg px-4 py-3 text-white font-medium">
                    {Array.isArray(tags) && tags.length > 0 // handles array that isn't defined or is empty
                        ? tags
                              .map((tag) => {
                                  const foundTag = predefinedTags.find(
                                      (t) => t.value === tag,
                                  );
                                  return foundTag
                                      ? foundTag.label
                                      : `Unknown (${tag})`;
                              })
                              .join(", ")
                        : "No tags found"}
                </div>
            </div>

            <div className="lg:col-span-2">
                <Button
                    variant="filled"
                    className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 py-2 px-6 rounded-lg"
                    onClick={() => router.push("account/edit-details")}
                >
                    Edit Details
                </Button>
            </div>
        </div>
    );
}
