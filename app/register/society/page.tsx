'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { SocietyRegisterFormData } from '@/app/lib/types';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import Image from 'next/image';
import { ArrowRightIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { upload } from '@vercel/blob/client';

export default function SocietyRegistrationForm() {
	const { register, handleSubmit, formState: { errors }, getValues, setValue } = useForm<SocietyRegisterFormData>({
		mode: 'onSubmit'
	});
	const [step, setStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const totalSteps = 2;

	const nextStep = () => {
		if (step < totalSteps) setStep(step + 1);
	};

	const calculateProgress = () => {
		return ((step) / (totalSteps)) * 100;
	};

	const onSubmit = async (data: SocietyRegisterFormData) => {
		const toastId = toast.loading('Creating your society\'s account...')

		try {
			const res = await fetch('/api/user/check-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: data.email }),
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
			const res = await fetch('/api/society/check-name', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: data.name }),
			});

			const result = await res.json();
			if (result.nameTaken) {
				toast.error('Society name already exists.', { id: toastId });
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
			const res = await fetch('/api/society/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await res.json()
			if (result.success) {
				toast.success('Society successfully created!', { id: toastId })
				nextStep()
			} else {
				toast.error(`Error creating account: ${result.error}`, { id: toastId })
				console.error('Error creating account:', result.error)
			}
		} catch (error) {
			toast.error(`Error during account creation: ${error.message}`, { id: toastId })
			console.error('Error during account creation:', error)
		}
	};


	// Email, Name, and Password
	const EmailPasswordNameEntry = () => (

		<div className='flex flex-col w-full'>
			<h2 className="text-4xl font-semibold mb-16">Let&#39;s create your <i>society</i>&#39;s account</h2>
			<p className="mt-4  text-gray-300">What is your society&#39;s official name?</p>

			<Input
				type="text"
				placeholder="Name"
				className="w-full mt-4 bg-transparent"
				{...register('name', { required: 'Name is required.' })}
			/>
			{errors.name && <p className="text-red-500 mt-2">{errors.name.message}</p>}

			<p className="mt-8  text-gray-300">Please register an email address</p>
			<Input
				type="email"
				placeholder="Email"
				className="w-full mt-4 bg-transparent"
				{...register('email', { required: 'Email is required.' })}
			/>
			{errors.email && <p className="text-red-500 mt-2">{errors.email.message}</p>}

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
				<p className="mt-4 text-gray-300"><i>Optional</i>: Please upload your society&#39;s logo</p>

				<div className='flex flex-col items-center'>
					<button className='flex flex-row self-start my-2 w-fit px-4 items-center font-light text-white border border-gray-300 hover:bg-gray-200 rounded-sm text-sm h-10' onClick={handleButtonClick}>
						<ArrowUpTrayIcon width={15} height={15} className='mr-2' /> Upload your logo here
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

				{/* Terms of Service (mandatory) */}
				<div className="mt-10">
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
				</div>
				{errors.hasAgreedToTerms && <p className="text-red-500 mt-2">{errors.hasAgreedToTerms.message}</p>}
				{/* Continue button */}
				<div className="flex justify-end mt-6 items-center">
					<Button variant='outline' onClick={handleSubmit(onSubmit)} className="p-3 text-white rounded-lg hover:bg-slate-500">
						Continue <ArrowRightIcon className='ml-2' width={15} height={15} />
					</Button>
				</div>
			</div>
		)
	}

	return (
		<main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">

			<div className="w-screen p-12 md:px-28">

				{step === 1 && <EmailPasswordNameEntry />}
				{step === 1 && <LogoEntry />}


				{step === totalSteps && (
					<div className="text-center items-center flex flex-col">
						<h2 className="text-4xl font-semibold">Thank you for registering!</h2>
						<p className="mt-4 text-gray-300">Your account has been created, and you can now sign in</p>
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