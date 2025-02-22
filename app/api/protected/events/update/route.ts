import { updateEvent, checkOwnershipOfEvent, fetchPriceId, updateTicket, fetchAccountIdByEvent } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils/type-manipulation';
import { validateEvent } from '@/app/lib/utils/events';
import { FormData } from '@/app/lib/types';
import { auth } from '@/auth';
import { upload } from '@vercel/blob/client';
import { getSecretStripePromise } from '@/app/lib/singletons-private';
import { convertToSubCurrency, extractPriceStringToTwoDecimalPlaces } from '@/app/lib/utils/type-manipulation';
import { createProduct } from '@/app/lib/utils/stripe/server-utilities';


const stripe = await getSecretStripePromise();

export async function POST(req: Request) {
    try{ 

        const { eventId, formData }: { eventId: string; formData: FormData } = await req.json();
        const session = await auth();

        // extract id
        const userId = session?.user?.id;

        if (userId) {
            const accessGranted = await checkOwnershipOfEvent(userId, eventId);

            if (accessGranted) {

                // -------------------------
                // validation of event
                // -------------------------
                
                const isNotValid = validateEvent(formData);

                if (isNotValid) {
                    return NextResponse.json(
                        { message: isNotValid},
                        { status: 400 } // 400 Bad Request
                    );
                }

                if (formData?.tickets_price && formData?.tickets_price !== '' && formData?.tickets_price !== '0') {
                    const response = await fetchAccountIdByEvent(eventId);
        
                    if (!response.success || !response.accountId) {
                        return NextResponse.json({ message: "please make a stripe connect account first, by editing your account details" }, { status: 403 }); // not allowed to create paid ticket without account
                    }
    
                    const accountId = response.accountId;
    
                    // Fetch the account
                    const account = await stripe.accounts.retrieve(accountId);
    
                    // Check if card payments and transfers are active
                    const hasCardPayments = account.capabilities?.card_payments === "active";
                    const hasTransfers = account.capabilities?.transfers === "active";
    
                    if (!hasCardPayments || !hasTransfers) {
                        return NextResponse.json({ message: "please finish stripe connect onboarding by editing your account details" }, { status: 403 }); // not allowed to create paid ticket without full account onboarding
                    }
                }


                // -------------------------
                // image upload
                // -------------------------

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

                // -------------------------
                // form data saving
                // -------------------------

                const data = { // update with new imageUrl
                    ...formData,
                    selectedImage: imageUrl,
                }
                const sqlEvent = await createSQLEventObject(data);
                const response1 = await updateEvent({ ...sqlEvent, id: eventId });	

                if (response1.status !== 200) {
                    return NextResponse.json(response1);
                }

                const response2 = await fetchPriceId(eventId);

                if (!response2.success) {
                    return NextResponse.json({message: response2.error.message, status: 500});
                }

                const oldPriceId = response2.priceId;
                await stripe.prices.update(oldPriceId, { active: false });

                try {
                    const response3 = convertToSubCurrency(sqlEvent.tickets_price);
                    if (response3?.value) {
                        const subvalue = response3.value;

                        const { subcurrencyAmount, productName, description } = {
                            subcurrencyAmount: subvalue,
                            productName: 'Standard Ticket',
                            description: data?.title? `Standard Ticket for ${data.title}` : 'Standard Ticket for event',
                        };

                        try {
                            const { priceId } = await createProduct(subcurrencyAmount, productName, description, stripe);

                            const response4 = extractPriceStringToTwoDecimalPlaces(sqlEvent.tickets_price);
                            if (response4.error) {
                                return NextResponse.json(
                                    { message: response4.error },
                                    { status: 500 } // 500 internal server error
                                );
                            } else {
                                const response5 = await updateTicket(eventId, priceId, response4.value);
                                if (!response5?.success) {
                                    return NextResponse.json(
                                        { message: "Failed to update the price id in the LSN db" },
                                        { status: 500 } // 500 internal server error
                                    );
                                } else { // ----------------- succesfull exit block -------------------
                                    return NextResponse.json( // --------------------------------------
                                        { message: "Event updated succesfully!" }, // -----------------
                                        { status: 200 } // 200 OK // ----------------------------------
                                    ); // -------------------------------------------------------------
                                } // ------------------------------------------------------------------
                            }

                        } catch(error) {
                            return NextResponse.json(
                                { message: error.message },
                                { status: 500 } // 500 internal server error
                            );
                        }

                    } else {
                        return NextResponse.json(
                            { message: "Failed to extract sub currency from ticket price" },
                            { status: 500 } // 500 internal server error
                        );
                    }
                } catch(error) {
                    return NextResponse.json(
                        { message: "Failed to create a new price id" },
                        { status: 500 } // 500 internal server error
                    );
                }

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
