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
        <div className="pb-4 mb-10 space-y-6">
            <p className="text-sm capitalize">
                <h3 className="text-lg font-semibold mb-2 text-white">
                    Description
                </h3>
                <hr className="border-t-1 border-gray-300 w-2/3 mt-2 mb-4" />
                <p className="text-gray-100 whitespace-pre-wrap">
                    {description || "No Description Found"}
                </p>
            </p>
            <p className="text-sm">
                <h3 className="text-lg font-semibold mb-2 text-white">
                    Website
                </h3>
                <hr className="border-t-1 border-gray-300 w-2/3 my-2" />
                <p className="text-gray-100 whitespace-pre-wrap">
                    {website || "No Website Found"}
                </p>
            </p>
            <p className="text-sm capitalize">
                <h3 className="text-lg font-semibold mb-2 text-white">Tags</h3>
                <hr className="border-t-1 border-gray-300 w-2/3 my-2" />
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
            </p>
            <Button
                variant="filled"
                className="bg-blue-600 text-white my-4 py-2 px-4 rounded-full"
                onClick={() => router.push("account/edit-details")}
            >
                Edit Details
            </Button>
        </div>
    );
}
