"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Event, Registrations } from "@/app/lib/types";

interface Props {
  onClose: () => void;
  event: Event;
}

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

export default function EventEmailSendingModal({ onClose, event }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState("");
  const [, setLoading] = useState<boolean>(false);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: session } = useSession();
  const [registrations, setRegistrations] = useState<Registrations[]>([]);
  const [sendToAll, setSendToAll] = useState<boolean>(true); // State to toggle between "Send to All" and "Single Recipient"
  const [customEmail, setCustomEmail] = useState<string>(""); // Custom email input for a single user

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
  //       onClose();
  //     }
  //   };
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [onClose]);


  useEffect(() => {
  const getRegistrations = async () => {
    const toastId = toast.loading("Fetching event registration data...");
    try {
      const res = await fetch("/api/events/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: event.id,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Event registrations loaded!", { id: toastId });
        setRegistrations(result.registrations);
      } else {
        toast.error("Error fetching event registrations!", { id: toastId });
      }
    } catch (error) {
      toast.error("Error fetching event registrations!", { id: toastId });
    }
  };
    const helper = async () => {
      await getRegistrations();
    };
    helper();
  });

  const sendEmail = async (recipientEmail: string) => {
    try {
      const response = await fetch("/api/email/send-user-notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail: recipientEmail,
          fromEmail: session?.user?.email,
          subject: subject,
          text: body,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Email sent to ${recipientEmail}!`);
      } else {
        toast.error(`Error sending email to ${recipientEmail}: ${result.error}`);
      }

      if (!response.ok) {
        throw new Error("Failed to send the email");
      }
    } catch (error) {
      toast.error(`Error during email sending: ${error.message}`);
      console.error("Failed to send email", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse({
      subject,
      body,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors.");
      return;
    }

    setErrors({});
    setLoading(true);

    const toastId = toast.loading(sendToAll ? "Sending emails..." : "Sending email...");
    try {
      if (sendToAll) {
        // Send emails to all registrations
        for (const registration of registrations) {
          await sendEmail(registration.user_email);
        }
        toast.success("All emails sent successfully!", { id: toastId });
      } else {
        // Send email to the custom single recipient
        if (!customEmail) {
          toast.error("Please enter a valid email address.");
          return;
        }
        await sendEmail(customEmail);
        toast.success("Email sent to the custom recipient!", { id: toastId });
      }

      onClose();
    } catch (error) {
      toast.error("Error sending emails.");
      console.error("Error during email sending process", error);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="relative bg-white w-[90vw] h-[80vh] p-8 border-2 border-black overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-black">Send Custom Email</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-sm underline"
          >
            Close
          </button>
        </div>

        <form
          className="flex flex-col gap-4 flex-grow text-black"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center mb-4">
            <label
              className="mr-2 text-sm font-medium"
              htmlFor="sendToAll"
            >
              Send To All
            </label>
            <input
              type="radio"
              id="sendToAll"
              name="emailOption"
              checked={sendToAll}
              onChange={() => setSendToAll(true)}
            />
            <label
              className="ml-4 mr-2 text-sm font-medium"
              htmlFor="sendToSingle"
            >
              Send to Single Recipient
            </label>
            <input
              type="radio"
              id="sendToSingle"
              name="emailOption"
              checked={!sendToAll}
              onChange={() => setSendToAll(false)}
            />
          </div>

          <div>
            {!sendToAll && (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="customEmail">
                  Recipient Email
                </label>
                <input
                  id="customEmail"
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}
            <label className="block text-sm font-medium mb-1" htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full border ${
                errors.subject ? "border-red-500" : "border-gray-300"
              } rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black`}
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          <div className="flex-grow flex flex-col">
            <label className="block text-sm font-medium mb-1" htmlFor="body">
              Message
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className={`w-full h-full resize-none border ${
                errors.body ? "border-red-500" : "border-gray-300"
              } rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black`}
            />
            {errors.body && (
              <p className="text-red-500 text-sm mt-1">{errors.body}</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded hover:opacity-90 text-sm"
            >
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
