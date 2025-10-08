import { EmailPayloadType } from "@/app/lib/types";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const EmailPayload = async ({ email, subject, text }: EmailPayloadType) => {
    // Convert markdown to HTML
    let formattedText: string;
    try {
        const result = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeSanitize)
            .use(rehypeStringify)
            .process(text);

        formattedText = String(result);
    } catch (error) {
        // Fallback to plain text with line breaks if markdown parsing fails
        console.error("Error parsing markdown:", error);
        formattedText = text.replace(/\n/g, "<br/>");
    }

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>You have a new communication from the LSN:</p>
            <br/>
            <p>Subject: <strong>${subject}</strong></p>
            <p>Sender: <strong>${email}</strong></p>
            <p>Content:</p>
            <div style="padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                ${formattedText}
            </div>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;"/>
            <p>Many thanks,</p>
            <p style="margin-left: 20px;">The LSN team</p>
        </div>
    `;
};

export default EmailPayload;
