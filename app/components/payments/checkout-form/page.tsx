// 'use client'


// import { SelectTicketComponentProps } from "@/app/lib/types"
// import getStripe from "@/app/lib/stripe_config";
// import { Stripe } from "stripe";

// getStripe()


// const proceedToCheckout = async (ticketPrice: string) => {
//     // Create a Checkout Session.
//     const checkoutSession: Stripe.Checkout.Session = await fetchPostJSON(
//       '/api/payments/checkout-sessions',
//       { amount: ticketPrice },
//     );
//     const res = await fetch('/api/user/update-account-fields', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ id: session?.user?.id, data: data }),
//     });
  
//     if ((checkoutSession as any).statusCode === 500) {
//       console.error((checkoutSession as any).message);
//       return;
//     }
  
//     // Redirect to Checkout.
//     const stripe = await getStripe();
//     const { error } = await stripe!.redirectToCheckout({
//       // Make the id field from the Checkout Session creation API response
//       // available to this file, so you can provide it as parameter here
//       // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
//       sessionId: checkoutSession.id,
//     });
//     // If `redirectToCheckout` fails due to a browser or network
//     // error, display the localized error message to your customer
//     // using `error.message`.
//     console.warn(error.message);
//   };


// export default function SelectTicketComponent({ ticketSelected, handleSelect, ticketPrice}: SelectTicketComponentProps) {
//     return(
//         <div className="mt-6">

//                 <div className="w-full flex flex-row justify-center">
//                     <div className="flex flex-col items-center">
//                         <h4 className="text-md font-semibold mb-2 text-gray-500">Select Ticket Type</h4>
//                         <div className="flex items-center mb-4">
//                             <input
//                                 type="checkbox"
//                                 id="ticket"
//                                 checked={ticketSelected}
//                                 onChange={handleSelect}
//                                 className="hidden"
//                             />
//                             <label
//                                 htmlFor="ticket"
//                                 className={`flex items-center cursor-pointer p-2 border-2 rounded-full ${ticketSelected ? 'bg-green-500' : 'bg-white'}`}
//                             >
//                                 <span className="text-gray-700">Standard Ticket - £{ticketPrice}</span>
//                             </label>
//                         </div>
//                         <button
//                             className="flex items-center px-4 text-sm font-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 hover:cursor-pointer h-12 text-gray-700 uppercase tracking-wider hover:text-black transition-transform duration-300 ease-in-out border-2 border-gray-600 rounded-sm mt-2 hover:bg-gray-200"
//                             onClick={() => proceedToCheckout(ticketPrice)}
//                             disabled={!ticketSelected}
//                         >
//                             Proceed to Secure Checkout
//                         </button>
//                     </div>
//                 </div>
//         </div>
//     )
// }
