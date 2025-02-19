import { useEffect } from "react";

const addMetadataClientSide = (title: string, description: string) => {
    useEffect(() => {
        // Set page title
        document.title = title;

        // Update or create meta description
        let metaDescription = document.querySelector("meta[name='description']");
        if (metaDescription) {
            metaDescription.setAttribute("content", description);
        } else {
            const meta = document.createElement("meta");
            meta.name = "description";
            meta.content = description;
            document.head.appendChild(meta);
        }
    }, [title, description]);
};

export default addMetadataClientSide;