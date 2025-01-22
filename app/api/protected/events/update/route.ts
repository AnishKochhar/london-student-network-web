import { updateEvent, checkOwnershipOfEvent } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject, validateEvent } from '@/app/lib/utils';
import { FormData } from '@/app/lib/types';
import { auth } from '@/auth';
import { upload } from '@vercel/blob/client';

export async function POST(req: Request) {
    try{ 

        const { eventId, formData }: { eventId: string; formData: FormData } = await req.json();
        const session = await auth();

        // extract id
        const userId = session?.user?.id;

        if (userId) {
            const accessGranted = await checkOwnershipOfEvent(userId, eventId);

            if (accessGranted) { // old event route + frontend image upload logic goes here, to be robust against malicious users
                const isNotValid = validateEvent(formData);

                if (isNotValid) {
                    return NextResponse.json(
                        { message: isNotValid},
                        { status: 400 } // 400 Bad Request
                    );
                }
                let imageUrl = formData.selectedImage;

                // console.log(formData);

                if (formData?.uploadedImage && formData?.uploadedImage?.name && typeof formData?.uploadedImage !== 'string') {
                    try {
                        const newBlob = await upload(formData.uploadedImage.name, formData.uploadedImage, {
                            access: 'public',
                            handleUploadUrl: '/api/upload-image',
                        })
        
                        imageUrl = newBlob.url;
                    } catch (error) {
                        return NextResponse.json(
                            { message: 'Error uploading event image', error },
                            { status: 500 } // 500 Internal Server Error
                        );
                    }
                }

                const data = { // update with new imageUrl
                    ...formData,
                    selectedImage: imageUrl,
                }
                const sqlEvent = await createSQLEventObject(data);
                const response = await updateEvent({ ...sqlEvent, id: eventId });	
                return NextResponse.json(response);
            } else {
                return NextResponse.json(
                    { message: "Forbidden: You do not have permission to access this resource" },
                    { status: 403 } // 403 Forbidden
                );
            }
        } else{
            return NextResponse.json(
                { message: "Unauthorized: You must be authorized" },
                { status: 401 } // 401 Unauthorized
            );
        }

    } catch (error) {
        console.error('Error verifying requester, there was an error in session extraction, or ownership verification', error);
        return NextResponse.json(
            { message: 'Error verifying requester', error },
            { status: 500 } // 500 Internal Server Error
        );
    }
}
