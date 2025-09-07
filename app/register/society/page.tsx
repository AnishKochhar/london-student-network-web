"use client"

import type React from "react"

// for future improvement, componetize some of the fields to be used with register and other forms
// also, replace upload with ImageUpload component

import { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import toast from "react-hot-toast"
import type { SocietyRegisterFormData } from "@/app/lib/types"
import { Button } from "../../components/button"
import { Input } from "../../components/input"
import Image from "next/image"
import { FlagIcon, ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline"
import { upload } from "@vercel/blob/client"
import Select from "react-select" // For tag selection
import getPredefinedTags, { LondonUniversities } from "@/app/lib/utils"

export default function SocietyRegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<SocietyRegisterFormData>({
    mode: "onSubmit",
    defaultValues: {
      tags: [], // Make sure tags is initialized as an empty array
    },
  })
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const totalSteps = 2
  const [predefinedTags, setPredefinedTags] = useState([])
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false)
  const [instagramConnected, setInstagramConnected] = useState(false)

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getPredefinedTags()
      setPredefinedTags(tags)
    }

    fetchTags()
  }, [])

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const calculateProgress = () => {
    return (step / totalSteps) * 100
  }

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
            body: JSON.stringify({ code }), 
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
  }, []); // The empty array [] ensures this hook only runs once when the component mounts

  const handleInstagramConnect = async () => {
    setIsConnectingInstagram(true)

    try {

      // const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
      const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=2556277784715839&redirect_uri=https://0e26c9e1feb8.ngrok-free.app/register/society&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
      // Redirect the user to Instagram to authorize the app
      window.location.href = authUrl;
    } catch (error) {
      toast.error("Error connecting to Instagram. Please try again.")
    } finally {
      setIsConnectingInstagram(false)
    }
  }

  const onSubmit = async (data: SocietyRegisterFormData) => {
    const toastId = toast.loading("Creating your society's account...")

    try {
      const res = await fetch("/api/user/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await res.json()
      if (result.emailTaken) {
        toast.error("Email already exists.", { id: toastId })
        return
      }
    } catch (error) {
      toast.error("Error checking email.", { id: toastId })
      return
    }

    try {
      const res = await fetch("/api/society/check-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      })

      const result = await res.json()
      if (result.nameTaken) {
        toast.error("Society name already exists.", { id: toastId })
        return
      }
    } catch (error) {
      toast.error("Error checking name.", { id: toastId })
      return
    }

    if (data.uploadedImage && typeof data.uploadedImage !== "string") {
      try {
        const newBlob = await upload(data.uploadedImage.name, data.uploadedImage, {
          access: "public",
          handleUploadUrl: "/api/upload-image",
        })

        data.imageUrl = newBlob.url
      } catch (error) {
        toast.error(`Error uploading image: ${error.message}`, { id: toastId })
        return
      }
    }

    try {
      const res = await fetch("/api/society/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (result.success) {
        toast.success("Society successfully created!", { id: toastId })
        nextStep()
        sendVerificationEmail(data)
      } else {
        toast.error(`Error creating account: ${result.error}`, { id: toastId })
        console.error("Error creating account:", result.error)
      }
    } catch (error) {
      toast.error(`Error during account creation: ${error.message}`, { id: toastId })
      console.error("Error during account creation:", error)
    }
  }

  const sendVerificationEmail = async (data: SocietyRegisterFormData) => {
    try {
      const response = await fetch("/api/email/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      })

      const sent = await response.json()

      if (!sent.success) {
        toast.error("Failed to send verification link.")
        return
      }
    } catch (error) {
      console.error("Error sending verification email:", error)
      toast.error("Failed to send verification email. Please try again later.")
    }
  }

  // Email, Name, and Password entry
  const EmailPasswordNameEntry = () => (
    <div className="flex flex-col w-full">
      <h2 className="text-4xl font-semibold mb-16">
        Let&#39;s create your <i>society</i>&#39;s account
      </h2>
      <p className="mt-4  text-gray-300">What is your society&#39;s official name?</p>
      <Input
        type="text"
        placeholder="Name"
        className="w-full mt-4 bg-transparent"
        {...register("name", { required: "Name is required." })}
      />
      {errors.name && <p className="text-red-500 mt-2">{errors.name.message}</p>}
      <p className="mt-8  text-gray-300">Please register an email address</p>
      <Input
        type="email"
        placeholder="Email"
        className="w-full mt-4 bg-transparent"
        {...register("email", { required: "Email is required." })}
      />
      {errors.email && <p className="text-red-500 mt-2">{errors.email.message}</p>}
      <p className="mt-10 text-gray-300">Please set a strong password for the account</p>
      <Input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        className="w-full mt-4 p-3 bg-transparent"
        {...register("password", {
          required: "Password is required.",
          minLength: {
            value: 8,
            message: "Password must be at least 8 characters long.",
          },
        })}
      />
      <Input
        type={showPassword ? "text" : "password"}
        placeholder="Confirm Password"
        className="w-full mt-4 p-3 bg-transparent"
        {...register("confirmPassword", {
          required: true,
          validate: (value) => value === getValues("password") || "Passwords do not match.",
        })}
      />
      {errors.password && <p className="text-red-500 mt-2">{errors.password.message}</p>}
      {errors.confirmPassword && <p className="text-red-500 mt-2">{errors.confirmPassword.message}</p>}
      <div className="mt-2 self-end">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          Show password
        </label>
      </div>
    </div>
  )

  const UniversityEntry = () => {
    const [isOtherSelected, setIsOtherSelected] = useState(false)
    const selectedUniversity = watch("university")

    useEffect(() => {
      if (selectedUniversity === "Other (please specify)") {
        setIsOtherSelected(true)
      } else {
        setIsOtherSelected(false)
      }
    }, [selectedUniversity])

    return (
      <div className="mb-8">
        <label className="mt-10 text-gray-300">What institution is your society from?</label>
        <select
          className="w-full mt-4 p-2 rounded-lg bg-transparent border border-gray-300 text-sm"
          {...register("university", { required: "University is required." })}
        >
          <option value="" className="text-gray-300">
            Select Institution
          </option>
          {LondonUniversities.map((university) => (
            <option key={university} value={university}>
              {university}
            </option>
          ))}
        </select>
        {isOtherSelected && (
          <Input
            type="text"
            placeholder="University"
            className="w-full mt-4 bg-transparent p-4"
            {...register("otherUniversity", { required: "University is required." })}
          />
        )}
        {errors.university && <p className="text-red-500 mt-2">{errors.university.message}</p>}
        {errors.otherUniversity && <p className="text-red-500 mt-2">{errors.otherUniversity.message}</p>}
      </div>
    )
  }

  // Description, Website and Tags entry
  const DescriptionWebsiteTagsEntry = () => (
    <div>
      <div>
        <label className="mt-10 text-gray-300">Description</label>
        <Input
          type="text"
          placeholder="Society Description"
          className="w-full mt-4 bg-transparent mb-[30px]"
          {...register("description")}
        />
      </div>
      <div>
        <label className="mt-10 text-gray-300">Website</label>
        <Input
          type="text"
          placeholder="Official Website Link"
          className="w-full mt-4 bg-transparent mb-[30px]"
          {...register("website")}
        />
      </div>
      <div className="pb-[10px]">
        <label className="mt-10 text-gray-300">Tags</label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={predefinedTags}
              isMulti
              className="w-full mt-4 bg-transparent"
              classNamePrefix="custom-select"
              value={field.value.map((tag) => predefinedTags.find((t) => t.value === tag))}
              onChange={(selectedTags) => {
                if (selectedTags.length > 3) {
                  toast.error("You can only select up to 3 tags")
                  return
                }
                const selectedValues = selectedTags.map((tag) => tag.value)
                field.onChange(selectedValues)
              }}
              getOptionLabel={(e) => e.label}
              getOptionValue={(e) => e.value}
              styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                }),
                option: (provided) => ({
                  ...provided,
                  color: "black",
                }),
                input: (provided) => ({
                  ...provided,
                  color: "white",
                }),
              }}
            />
          )}
        />
      </div>
    </div>
  )

  // Logo entry
  const LogoEntry = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    register("uploadedImage")

    const inputRef = useRef<HTMLInputElement>(null)

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      if (!inputRef || !inputRef.current) return

      inputRef.current?.click()
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        setUploadedImage(file)
        setValue("uploadedImage", file)
        setPreviewImage(URL.createObjectURL(file))
      }
    }

    const clearUploadedImage = () => {
      setUploadedImage(null)
      setValue("uploadedImage", null)
      setPreviewImage(null)
    }

    return (
      <div className="flex flex-col w-full">
        <p className="mt-4 text-gray-300">
          <i>Optional</i>: Please upload your society&#39;s logo
        </p>
        <div className="flex flex-col items-center">
          <button
            className="flex flex-row self-start my-2 w-fit px-4 items-center font-light text-white border border-gray-300 hover:bg-gray-200 rounded-sm text-sm h-10"
            onClick={handleButtonClick}
          >
            <ArrowUpTrayIcon width={15} height={15} className="mr-2" /> Upload your logo here
          </button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          {uploadedImage && (
            <Button
              variant="ghost"
              className="self-start text-sm text-red-600 hover:text-red-900"
              onClick={clearUploadedImage}
            >
              <TrashIcon width={10} height={10} className="mr-1" />
              Clear uploaded logo
            </Button>
          )}
          <div className="relative self-start w-[100px] h-[100px] border border-black overflow-hidden">
            <Image
              src={previewImage || "/images/no-image-found.png"}
              alt={"Your Logo"}
              fill
              className="w-[90%] h-64 object-cover border-2 border-black/70"
            />
          </div>
        </div>
        <div className="mt-10 p-6 border border-gray-300 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <h3 className="text-lg font-semibold text-white mb-3">Instagram Integration</h3>
          <p className="text-gray-300 text-sm mb-4">
            Connect your Instagram account to enable automatic event posting. Our AI will analyze your Instagram posts
            and automatically create event listings for your society, saving you time and ensuring your events reach a
            wider audience.
          </p>
          {!instagramConnected ? (
            <Button
			  variant="ghost"
              type="button"
              onClick={handleInstagramConnect}
              disabled={isConnectingInstagram}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {isConnectingInstagram ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                  </svg>
                  Connect Instagram
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Instagram Connected Successfully!
            </div>
          )}
        </div>
        <div className="mt-10">
          <label className="flex items-start">
            <input
              type="checkbox"
              className="mr-2 mt-1"
              {...register("hasAgreedToTerms", { required: "You must agree to the terms of service to continue." })}
            />
            <span>
              I agree to the{" "}
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                terms of service
              </a>{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
        {errors.hasAgreedToTerms && <p className="text-red-500 mt-2">{errors.hasAgreedToTerms.message}</p>}
        <div className="flex justify-end mt-6 items-center">
          <Button
            variant="outline"
            onClick={handleSubmit(onSubmit)}
            className="p-3 text-white rounded-lg hover:bg-slate-500 bg-transparent"
          >
            Submit <FlagIcon className="ml-2" width={15} height={15} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
      <div className="w-screen p-12 md:px-28">
        {step === 1 && <EmailPasswordNameEntry />}
        {step === 1 && <UniversityEntry />}
        {step === 1 && <DescriptionWebsiteTagsEntry />}
        {step === 1 && <LogoEntry />}
        {step === totalSteps && (
          <div className="text-center items-center flex flex-col">
            <h2 className="text-4xl font-semibold">Thank you for registering!</h2>
            <p className="mt-4 text-gray-300">
              Please verify your email with the link we sent for full access to the LSN.
            </p>
          </div>
        )}
        {step !== totalSteps && (
          <div className="relative mt-3">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-sm font-semibold inline-block py-1 px-2 uppercase">
                  Step {step} of {totalSteps}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${calculateProgress()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
              ></div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
