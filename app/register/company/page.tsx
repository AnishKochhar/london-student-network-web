'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CompanyRegisterFormData } from '@/app/lib/types';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import Image from 'next/image';
import { FlagIcon, ArrowUpTrayIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { upload } from '@vercel/blob/client';


export default function OrganisationRegistrationForm() {
	const { register, handleSubmit, formState: { errors }, getValues, setValue, watch } = useForm<CompanyRegisterFormData>({
		mode: 'onSubmit',
		defaultValues: {
			motivation: [], // Motivation initially empty
		},
	});
	const [step, setStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [options, setOptions] = useState<string[]>([
		"To list events",
		"To find skilled students",
		"To find corporate opportunities"
	]);
	const totalSteps = 2;


	const nextStep = () => {
		if (step < totalSteps) setStep(step + 1);
	};

	const calculateProgress = () => {
		return ((step) / (totalSteps)) * 100;
	};

	const onSubmit = async (data: CompanyRegisterFormData) => {
		const toastId = toast.loading('Creating your organisation\'s account...')

		try {
			const res = await fetch('/api/user/check-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: data.contactEmail }),
			});

			const result = await res.json();
			if (result.emailTaken) {
				toast.error('Email already exists.', { id: toastId });
				return
			}
		} catch (error) {
			toast.error('Error checking email.', { id: toastId });
			return
		}

		try {
			const res = await fetch('/api/organisation/check-name', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: data.companyName }),
			});

			const result = await res.json();
			if (result.nameTaken) {
				toast.error('Company name already exists.', { id: toastId });
				return
			}
		} catch (error) {
			toast.error('Error checking name.', { id: toastId });
			return
		}

		if (data.uploadedImage && typeof data.uploadedImage !== 'string') {
			try {
				const newBlob = await upload(data.uploadedImage.name, data.uploadedImage, {
					access: 'public',
					handleUploadUrl: '/api/upload-image',
				})

				data.imageUrl = newBlob.url
			} catch (error) {
				toast.error(`Error uploading image: ${error.message}`, { id: toastId })
				return
			}
		}

		try {
			const res = await fetch('/api/organisation/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await res.json()
			if (result.success) {
				toast.success('Organisation successfully created!', { id: toastId })
				nextStep()
				sendVerificationEmail(data)
			} else {
				toast.error(`Error creating account: ${result.error}`, { id: toastId })
				console.error('Error creating account:', result.error)
			}
		} catch (error) {
			toast.error(`Error during account creation: ${error.message}`, { id: toastId })
			console.error('Error during account creation:', error)
		}

		
	};

	const sendVerificationEmail = async (data: CompanyRegisterFormData) => {
		try {
			const response = await fetch('/api/email/send-verification-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: data.contactEmail }),
			});

			const sent = await response.json();

			if (!sent.success) {
				toast.error('Failed to send verification link.');
				return;
			}
		} catch (error) {
			console.error('Error sending verification email:', error);
			toast.error('Failed to send verification email. Please try again later.');
		}
	}


	// Email, Name, and Password entry
	const EmailPasswordNameEntry = () => (

		<div className='flex flex-col w-full'>
			<h2 className="text-4xl font-semibold mb-16">Let&#39;s create your <i>organisation</i>&#39;s account</h2>
			<p className="mt-4  text-gray-300">What is your organisation&#39;s official name?</p>

			<Input
				type="text"
				placeholder="Name"
				className="w-full mt-4 bg-transparent"
				{...register('companyName', { required: 'Name is required.' })}
			/>
			{errors.companyName && <p className="text-red-500 mt-2">{errors.companyName.message}</p>}

			<p className="mt-8  text-gray-300">Please register a contact email address - used for log in</p>
			<Input
				type="email"
				placeholder="Email"
				className="w-full mt-4 bg-transparent"
				{...register('contactEmail', { required: 'Email is required.' })}
			/>
			{errors.contactEmail && <p className="text-red-500 mt-2">{errors.contactEmail.message}</p>}

			<p className="mt-8  text-gray-300">Please register a person/people of contact</p>
			<Input
				type="text"
				placeholder="Contact Full Name"
				className="w-full mt-4 bg-transparent"
				{...register('contactName', { required: 'Contact name is required.' })}
			/>
			{errors.contactName && <p className="text-red-500 mt-2">{errors.contactName.message}</p>}

			<p className="mt-10 text-gray-300">Please set a strong password for the account</p>

			<Input
				type={showPassword ? 'text' : 'password'}
				placeholder="Password"
				className="w-full mt-4 p-3 bg-transparent"
				{...register('password', {
					required: 'Password is required.',
					minLength: {
						value: 8,
						message: 'Password must be at least 8 characters long.',
					},
				})}

			/>

			<Input
				type={showPassword ? 'text' : 'password'}
				placeholder="Confirm Password"
				className="w-full mt-4 p-3 bg-transparent"
				{...register('confirmPassword', {
					required: true,
					validate: (value) => value === getValues('password') || 'Passwords do not match.',
				})}
			/>
			{errors.password && <p className="text-red-500 mt-2">{errors.password.message}</p>}
			{errors.confirmPassword && <p className="text-red-500 mt-2">{errors.confirmPassword.message}</p>}

			{/* Show password toggle */}
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

	// Description, Website and Tags entry
	const DescriptionWebsiteEntry = () => (
		<div>
			<div>
				<label className="mt-10 text-gray-300">Company description - shared with students</label>
				<textarea
					id="description"
					rows={4}
					placeholder="Description"
					className="w-full mt-4 mb-[30px] self-end block p-3 text-sm bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					{...register('description')}
				/>
			</div>
			<div>
				<label className="mt-10 text-gray-300">Website</label>
				<Input
					type="text"
					placeholder="Official Website Link"
					className="w-full mt-4 bg-transparent mb-[30px]"
					{...register('website')}
				/>
			</div>
		</div>
	)

	// Logo entry
	const LogoEntry = () => {
		const [uploadedImage, setUploadedImage] = useState<File | null>(null);
		const [previewImage, setPreviewImage] = useState<string | null>(null);
		register('uploadedImage')

		const inputRef = useRef<HTMLInputElement>(null)

		const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (!inputRef || !inputRef.current) return;

			inputRef.current?.click();
		}

		const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (file) {
				setUploadedImage(file)
				setValue('uploadedImage', file)
				setPreviewImage(URL.createObjectURL(file))
			}
		}

		const clearUploadedImage = () => {
			setUploadedImage(null)
			setValue('uploadedImage', null)
			setPreviewImage(null)
		}

		return (
			<div className='flex flex-col w-full'>
				<p className="mt-8 text-gray-300">Please upload your company&#39;s logo</p>

				<div className='flex flex-col items-center'>
					<button className='flex flex-row self-start my-2 w-fit px-4 items-center font-light text-white border border-gray-300 hover:bg-gray-200 rounded-sm text-sm h-10' onClick={handleButtonClick}>
						<ArrowUpTrayIcon width={15} height={15} className='mr-2' /> Upload your logo here  <br /> <span className='text-gray-300 ml-2 whitespace-pre'>(accepted files: .jpg, .png, .gif) </span>
					</button>
					<input
						ref={inputRef}
						type='file'
						accept='image/*'
						hidden
						onChange={handleImageUpload}
					/>

					{uploadedImage && (
						<Button
							variant='ghost'
							className='self-start text-sm text-red-600 hover:text-red-900'
							onClick={clearUploadedImage}
						>
							<TrashIcon width={10} height={10} className='mr-1' />
							Clear uploaded logo
						</Button>
					)}
					<div className="relative self-start w-[100px] h-[100px] border border-black overflow-hidden">
						<Image
							src={previewImage || '/images/no-image-found.png'}
							alt={'Your Logo'}
							fill
							className="w-[90%] h-64 object-cover border-2  border-black/70"
						/>
					</div>
				</div>
			</div>
		)
	}

	const TermsAgreementEntry = () => (
		<div className='flex flex-col w-full'>
			{/* Terms of Service (mandatory) */}
			< div className="mt-10" >
				<label className="flex items-start">
					<input type="checkbox" className="mr-2 mt-1" {...register('hasAgreedToTerms', { required: 'You must agree to the terms of service to continue.' })} />
					<span>
						I agree to the{' '}
						<a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
							terms of service
						</a>{' '}
						<span className="text-red-500">*</span>
					</span>
				</label>
			</div >
			{errors.hasAgreedToTerms && <p className="text-red-500 mt-2">{errors.hasAgreedToTerms.message}</p>}

			{/* Finish button */}
			<div className="flex justify-end mt-6 items-center">
				<Button variant='outline' onClick={handleSubmit(onSubmit)} className="p-3 text-white rounded-lg hover:bg-slate-500">
					Submit <FlagIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>
		</div>
	)

	const MotivationEntry = () => {
		const [newOption, setNewOption] = useState("");
		const motivation = watch("motivation") || [];

		const handleAddOption = () => {
			if (newOption.trim() && !options.includes(newOption)) {
				const updatedOptions = [...options, newOption];
				setOptions(updatedOptions);
				setValue("motivation", [...motivation, newOption]);
				setNewOption(""); // Clear input field
			}
		};

		const handleCheckboxChange = (option: string, checked: boolean) => {
			const updatedMotivation = checked
				? [...motivation, option] // Add to form state
				: motivation.filter((item: string) => item !== option); // Remove from form state
			setValue("motivation", updatedMotivation);
		};

		return (
			<div>
				<p className="mt-10 mb-2 text-gray-300">What will you be using LSN for?</p>
				<div className="flex flex-col gap-4">
					{options.map((option) => (
						<div key={option} className="flex items-center gap-2">
							<input
								type="checkbox"
								id={option}
								className="form-checkbox"
								checked={motivation.includes(option)}
								onChange={(e) => handleCheckboxChange(option, e.target.checked)}
							/>
							<label htmlFor={option} className="text-sm">{option}</label>
						</div>
					))}
				</div>

				<div className="mt-4 flex flex-row items-center justify-center space-x-2">
					<Input
						type="text"
						value={newOption}
						onChange={(e) => setNewOption(e.target.value)}
						placeholder="Add a motivation"
						className="w-full bg-transparent p-4 border border-gray-300 rounded-lg"
					/>
					<button
						type="button"
						onClick={handleAddOption}
						className="p-3 border border-white backdrop-blur-lg text-white rounded-lg hover:bg-blue-600"
					>
						<PlusIcon width={12} height={12} className='w-full h-max' />
					</button>
				</div>

				{errors.motivation && (
					<p className="text-red-500 mt-2">{errors.motivation.message}</p>
				)}
			</div>
		);

	}


	return (
		<main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">

			<div className="w-screen p-12 md:px-28">

				{step === 1 && <EmailPasswordNameEntry />}
				{step === 1 && <DescriptionWebsiteEntry />}
				{step === 1 && <MotivationEntry />}
				{step === 1 && <LogoEntry />}
				{step === 1 && <TermsAgreementEntry />}


				{step === totalSteps && (
					<div className="text-center items-center flex flex-col">
						<h2 className="text-4xl font-semibold">Thank you for registering!</h2>
						<p className="mt-4 text-gray-300">Please verify your email with the link we sent for full access to LSN.</p>
					</div>
				)}

				{/* Progress Bar */}
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
