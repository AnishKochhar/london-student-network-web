import { updateEvent, checkOwnershipOfEvent, fetchEventTickets, insertIntoTickets, deleteTickets, fetchAccountId } from '@/app/lib/data';
import { NextResponse } from 'next/server';
import { createSQLEventObject } from '@/app/lib/utils/type-manipulation';
import { validateEvent } from '@/app/lib/utils/events';
import { FormData, TicketInfo } from '@/app/lib/types';
import { auth } from '@/auth';
import { upload } from '@vercel/blob/client';
import { getSecretStripePromise } from '@/app/lib/singletons-private';
import { convertToSubCurrency } from '@/app/lib/utils/type-manipulation';
import { createProduct } from '@/app/lib/utils/stripe/server-utilities';

const stripe = await getSecretStripePromise();

export async function POST(req: Request) {
  try {
    const { eventId, formData }: { eventId: string; formData: FormData } = await req.json();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "You must be logged in" },
        { status: 401 }
      );
    }

    const accessGranted = await checkOwnershipOfEvent(userId, eventId);
    if (!accessGranted) {
      return NextResponse.json(
        { message: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Validate event data
    const validationError = validateEvent(formData);
    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      );
    }

    // Check for paid tickets and validate Stripe account
    const hasPaidTickets = formData.tickets_info?.some(t => t.price && t.price > 0);
    let accountId: string | null = null;

    if (hasPaidTickets) {
      const accountResponse = await fetchAccountId(userId);
      if (!accountResponse.success) {
        return NextResponse.json(
          { message: "Unexpected error, please try again later" }, // sql command failed to retrieve, or app failed to add accountId
          { status: 500 }
        );
      }
      if (!accountResponse.accountId) {
        return NextResponse.json(
          { message: "Complete Stripe Connect setup to add paid tickets" },
          { status: 403 }
        );
      }

      const account = await stripe.accounts.retrieve(accountResponse.accountId);
      if (account.capabilities.transfers !== "active") {
        return NextResponse.json(
          { message: "Complete Stripe Connect setup to enable bank transfers" },
          { status: 403 }
        );
      }
      if (!account.payouts_enabled) {
        return NextResponse.json(
          { message: "Complete Stripe Connect setup to enable payouts" },
          { status: 403 }
        );
      }
      accountId = accountResponse.accountId;
    }

    // Handle image upload
    let imageUrl = formData.selectedImage;
    if (formData?.uploadedImage?.name && typeof formData.uploadedImage !== 'string') {
      try {
        const newBlob = await upload(formData.uploadedImage.name, formData.uploadedImage, {
          access: 'public',
          handleUploadUrl: '/api/upload-image',
        });
        imageUrl = newBlob.url;
      } catch (error) {
        return NextResponse.json(
          { message: 'Error updating event image', error },
          { status: 500 }
        );
      }
    }

    // Update main event (tickets updated later downstream. In the future, tickets should be all updated at the same time with UNNEST. TODO)
    const updatedData = { ...formData, selectedImage: imageUrl, organiser_uid: userId };
    // const sqlEvent = await createSQLEventObject(updatedData);
    const eventUpdateResponse = await updateEvent( updatedData, eventId );

    if (!(eventUpdateResponse.status === 200)) {
      return NextResponse.json(
        { message: eventUpdateResponse.error },
        { status: eventUpdateResponse.status }
      );
    }
    // Process tickets
    const existingTickets = await fetchEventTickets(eventId);
    const incomingTickets = formData.tickets_info || [];
    
    // Identify tickets to create: those in incomingTickets that don't match an existing ticket by name and price.
    // const ticketsToCreate = incomingTickets.filter(ticket =>
    //   !existingTickets.some(existing =>
    //     existing.ticketName === ticket.ticketName && existing.price === ticket.price ||
    //     existing.ticketName === ticket.ticketName && existing.capacity === ticket.capacity
    //   )
    // );
    
    // Identify tickets to delete: those in existingTickets that don't appear in the incomingTickets.
    // const ticketsToDelete = existingTickets.filter(existing =>
    //   !incomingTickets.some(ticket =>
    //     ticket.ticketName === existing.ticketName && ticket.price === existing.price ||
    //     existing.ticketName === ticket.ticketName && existing.capacity === ticket.capacity
    //   )
    // );

    const isSameTicket = (a: TicketInfo, b: TicketInfo) => 
      a.ticketName === b.ticketName &&
      a.price === b.price &&
      a.capacity === b.capacity;
    
    const ticketsToCreate = incomingTickets.filter(incoming => 
      !existingTickets.some(existing => isSameTicket(existing, incoming))
    );
    
    const ticketsToDelete = existingTickets.filter(existing => 
      !incomingTickets.some(incoming => isSameTicket(incoming, existing))
    );
    
    try {
        // Delete old tickets: deactivate related Stripe prices and delete tickets from the database.
        if (ticketsToDelete.length > 0) {
          await Promise.all(
            ticketsToDelete.map(async (ticket) => {
              if (ticket.priceId) {
                await stripe.prices.update(ticket.priceId, { active: false })  
                  .catch(error => {
                    console.error(`Failed to deactivate Stripe price ${ticket.priceId}:`, error);
                    throw error; // Rethrow to trigger rollback
                  });;
              }
            })
          );
          // Delete tickets using composite keys
          await deleteTickets(
            ticketsToDelete.map(ticket => ({
              eventId,
              ticketId: ticket.ticketId,
            }))
          );
        }
    
        // Create new tickets using your insertIntoTickets function
        console.log(ticketsToCreate);
        const newTicketsResponse = await insertIntoTickets(
          eventId,
          await Promise.all(
            ticketsToCreate.map(async (ticket) => {
              console.log('');
              let priceId = null;
              if (ticket.price && ticket.price > 0) {
                const subValue = convertToSubCurrency(ticket.price);
                if (subValue.error) {
                  throw new Error(`Invalid price for ${ticket.ticketName}`);
                }
                // Create a new Stripe product/price
                const { priceId: newPriceId } = await createProduct(
                  subValue.value,
                  ticket.ticketName,
                  `Ticket for ${formData.title}`,
                  stripe
                );
                priceId = newPriceId;
              }
              return {
                ticketName: ticket.ticketName,
                price: ticket.price !== null ? ticket.price : 0,
                priceId,
                capacity: ticket.capacity,
              };
            })
          )
        );
      
        if (!newTicketsResponse.success) {
          throw new Error('Failed to update tickets in database');
        }

        return NextResponse.json(
            { message: 'success' },
            { status: 200 }
        );

    } catch (error) {
      console.error('Ticket update failed:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to update tickets' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { message: 'Internal server error during update' },
      { status: 500 }
    );
  }
}
