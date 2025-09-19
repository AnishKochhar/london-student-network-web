import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () =>
                /* pathname, */
                /* clientPayload */
                {
                    // Generate a client token for the browser to upload the file
                    return {
                        allowedContentTypes: [
                            "image/jpeg",
                            "image/png",
                            "image/gif",
                        ],
                    };
                },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log("Blob upload completed", blob, tokenPayload);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}
