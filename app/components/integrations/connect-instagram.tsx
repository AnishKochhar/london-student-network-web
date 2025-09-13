"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

export default function InstagramConnection() {
  const { data: session } = useSession()
  const [instagramConnected, setInstagramConnected] = useState(false)
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  if (session?.user?.role !== "organiser"){
    return
  }
  useEffect(() => {
    async function checkExistingToken() {
      if (!session?.user?.id) {
        setIsCheckingToken(false)
        return
      }

      try {
        const result = await fetch('/api/integrations/instagram/check-if-connected')
        const userData = await result.json()
        setInstagramConnected(userData.isConnected)
      } catch (error) {
        console.error("Error checking Instagram token:", error)
        setInstagramConnected(false)
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkExistingToken()
  }, [session?.user?.id])


  useEffect(() => { // to catch instagram oauth redirect
    // This effect runs once on page load to check if we've been redirected from Instagram
    const handleInstagramRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      // If a 'code' is present in the URL, the user has just authorized our app
      if (code) {
        // It's good practice to clean the URL so this doesn't re-run on a refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        setIsConnectingInstagram(true); // Show a loading indicator
        const toastId = toast.loading("Finalizing Instagram connection...");

        try {
          // Send this temporary code to our backend to be exchanged for a real token
          const response = await fetch('/api/integrations/instagram/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // In a real app, you might also send the societyId/userId here
            body: JSON.stringify({ code, redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_BASE_URL + window.location.pathname }), 
          });

          if (response.ok) {
            setInstagramConnected(true);
            toast.success("Instagram connected successfully!", { id: toastId });
          } else {
            // Handle errors from our backend
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to finalize connection.", { id: toastId });
          }
        } catch (error) {
          toast.error("An error occurred. Please try again.", { id: toastId });
        } finally {
          setIsConnectingInstagram(false);
        }
      }
    };

    handleInstagramRedirect();
  }, []);

  const handleInstagramConnect = async () => {
      setIsConnectingInstagram(true)

      try {
          // const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
          // const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=2556277784715839&redirect_uri=https://d101aac4d1da.ngrok-free.app/register/society&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
          // const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=2556277784715839&redirect_uri=https://094c88143350.ngrok-free.app/${window.location.pathname}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
          const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_INSTAGRAM_BASE_URL + window.location.pathname)}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
          console.log("THIS IS THE AUTHURL!!!", authUrl)
          window.location.href = authUrl;
      } catch (error) {
      toast.error("Error connecting to Instagram. Please try again.")
      } finally {
          setIsConnectingInstagram(false)
      }
  }

  const InstagramIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
  );

  const LoaderIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <InstagramIcon className="h-5 w-5" />
          Instagram Connection
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {isCheckingToken
            ? "Checking connection status..."
            : instagramConnected
            ? "Your Instagram account is connected and ready for polling."
            : "Connect your Instagram account to start monitoring your posts for events."}
        </p>
      </div>

      <div>
        {isCheckingToken ? (
          <div className="flex items-center justify-center py-4">
             <LoaderIcon className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : instagramConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleInstagramConnect}
              disabled={isConnectingInstagram}
              className="w-full max-w-[600px] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnectingInstagram ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <InstagramIcon className="mr-2 h-4 w-4" />
                  Connect Instagram
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
