"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CompanyRegisterFormData } from "@/app/lib/types";
import ModernFormStep from "./modern-form-step";
import { ModernInput } from "./modern-input";
import ErrorModal from "./error-modal";
import { EyeIcon, EyeSlashIcon, ArrowUpTrayIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { upload } from '@vercel/blob/client';
import Image from 'next/image';

export default function ModernCompanyRegistration() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
	const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
	
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [newMotivation, setNewMotivation] = useState("");
	const [motivationOptions, setMotivationOptions] = useState<string[]>([
		"To list events",
		"To find skilled students", 
		"To find corporate opportunities"
	]);
	const totalSteps = 5;

	const inputRef = useRef<HTMLInputElement>(null);

	const { 
		register, 
		handleSubmit, 
		formState: { errors }, 
		getValues, 
		watch,
		trigger,
		setValue
	} = useForm<CompanyRegisterFormData>({
		mode: 'onChange',
		defaultValues: {
			motivation: [],
		},
	});

	const watchedValues = watch();
	const motivation = watch("motivation") || [];

	const nextStep = async () => {
		const isValid = await validateCurrentStep();
		if (isValid && currentStep < totalSteps) {
			setDirection('forward');
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep === 1) {
			router.push('/register');
		} else if (currentStep > 1) {
			setDirection('backward');
			setCurrentStep(currentStep - 1);
		}
	};

	const handleStepClick = (step: number) => {
		if (step < currentStep) {
			setDirection('backward');
			setCurrentStep(step);
		}
	};

	const validateCurrentStep = async () => {
		switch (currentStep) {
			case 1:
				return await trigger(['companyName', 'hasAgreedToTerms']);
			case 2:
				return await trigger(['contactEmail', 'contactName']);
			case 3:
				return await trigger(['password', 'confirmPassword']);
			case 4:
				return true; // Optional fields
			case 5:
				return true; // Optional fields
			default:
				return true;
		}
	};

	const canContinue = () => {
		switch (currentStep) {
			case 1:
				return watchedValues.companyName && watchedValues.hasAgreedToTerms;
			case 2:
				return watchedValues.contactEmail && watchedValues.contactName && !errors.contactEmail;
			case 3:
				return watchedValues.password && watchedValues.confirmPassword && !errors.password && !errors.confirmPassword;
			case 4:
				return true;
			case 5:
				return true;
			default:
				return true;
		}
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			
			setValue('uploadedImage', file);
			setPreviewImage(URL.createObjectURL(file));
		}
	};

	const clearUploadedImage = () => {
		
		setValue('uploadedImage', null);
		setPreviewImage(null);
	};

	const handleAddMotivation = () => {
		if (newMotivation.trim() && !motivationOptions.includes(newMotivation)) {
			const updatedOptions = [...motivationOptions, newMotivation];
			setMotivationOptions(updatedOptions);
			setValue("motivation", [...motivation, newMotivation]);
			setNewMotivation("");
		}
	};

	const handleMotivationChange = (option: string, checked: boolean) => {
		const updatedMotivation = checked
			? [...motivation, option]
			: motivation.filter((item: string) => item !== option);
		setValue("motivation", updatedMotivation);
	};

	const onSubmit = async (data: CompanyRegisterFormData) => {
		const toastId = toast.loading('Creating your organisation\'s account...');
		
		try {
			const emailCheck = await fetch('/api/user/check-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: data.contactEmail }),
			});
			const emailResult = await emailCheck.json();
			if (emailResult.emailTaken) {
				toast.dismiss(toastId);
				setErrorModal({
					isOpen: true,
					title: 'Email Already Exists',
					message: 'An account with this email address already exists. Please use a different email or try logging in.'
				});
				return;
			}
		} catch (error) {
			toast.dismiss(toastId);
			setErrorModal({
				isOpen: true,
				title: 'Connection Error',
				message: 'Unable to verify email address. Please check your connection and try again.'
			});
			return;
		}

		try {
			const nameCheck = await fetch('/api/organisation/check-name', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: data.companyName }),
			});
			const nameResult = await nameCheck.json();
			if (nameResult.nameTaken) {
				toast.dismiss(toastId);
				setErrorModal({
					isOpen: true,
					title: 'Company Name Already Exists',
					message: 'A company with this name already exists. Please choose a different name.'
				});
				return;
			}
		} catch (error) {
			toast.dismiss(toastId);
			setErrorModal({
				isOpen: true,
				title: 'Connection Error',
				message: 'Unable to verify company name. Please check your connection and try again.'
			});
			return;
		}

		if (data.uploadedImage && typeof data.uploadedImage !== 'string') {
			try {
				const newBlob = await upload(data.uploadedImage.name, data.uploadedImage, {
					access: 'public',
					handleUploadUrl: '/api/upload-image',
				});
				data.imageUrl = newBlob.url;
			} catch (error) {
				toast.dismiss(toastId);
				setErrorModal({
					isOpen: true,
					title: 'Upload Error',
					message: 'Failed to upload logo. Please try again.'
				});
				return;
			}
		}

		try {
			const response = await fetch('/api/organisation/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			const result = await response.json();
			if (result.success) {
				toast.success('Organisation account created successfully!', { id: toastId });
				setCurrentStep(totalSteps + 1);
				
				await fetch('/api/email/send-verification-email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: data.contactEmail }),
				});
			} else {
				toast.error(`Error: ${result.error}`, { id: toastId });
			}
		} catch (error) {
			toast.error('Registration failed', { id: toastId });
		}
	};

	return (
		<AnimatePresence mode="wait">
			{currentStep === 1 && (
				<ModernFormStep
					key="step1"
					title="What's your company name?"
					subtitle="This will be displayed to students on the platform"
					currentStep={currentStep}
					totalSteps={totalSteps}
					onNext={nextStep}
					onBack={prevStep}
					canContinue={canContinue()}
					direction={direction}
					onStepClick={handleStepClick}
				>
					<div className="space-y-6">
						<ModernInput
							placeholder="Company Name"
							error={errors.companyName?.message}
							{...register('companyName', { required: 'Company name is required' })}
						/>
						<div className="flex items-center justify-center">
							<label className="flex items-center text-gray-300 cursor-pointer">
								<input
									type="checkbox"
									className="mr-3 w-4 h-4"
									{...register('hasAgreedToTerms', { required: 'You must agree to continue' })}
								/>
								<span className="text-sm">I agree to the <a href="/terms-conditions" className="text-blue-400 underline" target="_blank">terms and conditions</a></span>
							</label>
						</div>
						{errors.hasAgreedToTerms && <p className="text-red-400 text-center text-sm">{errors.hasAgreedToTerms.message}</p>}
					</div>
				</ModernFormStep>
			)}

			{currentStep === 2 && (
				<ModernFormStep
					key="step2"
					title="Contact information"
					subtitle="We'll use these details for account management"
					currentStep={currentStep}
					totalSteps={totalSteps}
					onNext={nextStep}
					onBack={prevStep}
					canContinue={canContinue()}
					direction={direction}
					onStepClick={handleStepClick}
				>
					<div className="space-y-4">
						<ModernInput
							type="email"
							placeholder="Contact Email Address"
							error={errors.contactEmail?.message}
							{...register('contactEmail', { 
								required: 'Contact email is required',
								pattern: {
									value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
									message: 'Invalid email address'
								}
							})}
						/>
						<ModernInput
							placeholder="Contact Person's Full Name"
							error={errors.contactName?.message}
							{...register('contactName', { required: 'Contact name is required' })}
						/>
					</div>
				</ModernFormStep>
			)}

			{currentStep === 3 && (
				<ModernFormStep
					key="step3"
					title="Create a password"
					subtitle="Choose a strong password to keep your account secure"
					currentStep={currentStep}
					totalSteps={totalSteps}
					onNext={nextStep}
					onBack={prevStep}
					canContinue={canContinue()}
					direction={direction}
					onStepClick={handleStepClick}
				>
					<div className="space-y-4">
						<ModernInput
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							error={errors.password?.message}
							{...register('password', {
								required: 'Password is required',
								minLength: {
									value: 8,
									message: 'Password must be at least 8 characters'
								}
							})}
						/>
						<ModernInput
							type={showPassword ? "text" : "password"}
							placeholder="Confirm Password"
							error={errors.confirmPassword?.message}
							{...register('confirmPassword', {
								required: 'Please confirm your password',
								validate: value => value === getValues('password') || 'Passwords do not match'
							})}
						/>
						<div className="flex justify-center mt-4">
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
							>
								{showPassword ? (
									<EyeSlashIcon className="w-5 h-5" />
								) : (
									<EyeIcon className="w-5 h-5" />
								)}
								<span>{showPassword ? 'Hide password' : 'Show password'}</span>
							</button>
						</div>
					</div>
				</ModernFormStep>
			)}

			{currentStep === 4 && (
				<ModernFormStep
					key="step4"
					title="Tell us about your company"
					subtitle="This information helps students discover opportunities with you"
					currentStep={currentStep}
					totalSteps={totalSteps}
					onNext={nextStep}
					onBack={prevStep}
					canContinue={canContinue()}
					direction={direction}
					onStepClick={handleStepClick}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-gray-300 text-left block">Company Description (optional)</label>
							<textarea
								placeholder="Tell students about your company..."
								rows={4}
								className="w-full p-3 sm:p-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-base sm:text-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent resize-none"
								{...register('description')}
							/>
						</div>
						<ModernInput
							placeholder="Website URL (optional)"
							error={errors.website?.message}
							{...register('website')}
						/>
					</div>
				</ModernFormStep>
			)}

			{currentStep === 5 && (
				<ModernFormStep
					key="step5"
					title="What will you use LSN for?"
					subtitle="Upload your logo and tell us about your goals"
					currentStep={currentStep}
					totalSteps={totalSteps}
					onNext={handleSubmit(onSubmit)}
					onBack={prevStep}
					canContinue={canContinue()}
					isLastStep={true}
					direction={direction}
					onStepClick={handleStepClick}
				>
					<div className="space-y-6">
						<div className="space-y-4">
							<label className="text-gray-300 text-left block">What will you be using LSN for?</label>
							<div className="grid grid-cols-1 gap-3">
								{motivationOptions.map((option) => (
									<label key={option} className="flex items-center space-x-3 p-3 sm:p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
										<div className="relative flex-shrink-0">
											<input
												type="checkbox"
												className="sr-only"
												checked={motivation.includes(option)}
												onChange={(e) => handleMotivationChange(option, e.target.checked)}
											/>
											<div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
												motivation.includes(option) 
													? 'bg-blue-500 border-blue-500' 
													: 'border-white/30 bg-transparent'
											}`}>
												{motivation.includes(option) && (
													<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
													</svg>
												)}
											</div>
										</div>
										<span className="text-gray-300 flex-1">{option}</span>
									</label>
								))}
							</div>

							<div className="mt-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
								<label className="text-gray-300 text-left block text-sm mb-3">Add custom motivation (optional)</label>
								<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
									<div className="flex-1">
										<ModernInput
											value={newMotivation}
											onChange={(e) => setNewMotivation(e.target.value)}
											placeholder="e.g. To recruit interns"
										/>
									</div>
									<button
										type="button"
										onClick={handleAddMotivation}
										disabled={!newMotivation.trim()}
										className="flex-shrink-0 px-4 py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all w-full sm:w-auto flex items-center justify-center"
									>
										<PlusIcon className="w-5 h-5 sm:mr-0 mr-2" />
										<span className="sm:hidden">Add Motivation</span>
									</button>
								</div>
								{newMotivation.trim() && (
									<p className="text-gray-400 text-xs mt-2">This will be added to your motivations list</p>
								)}
							</div>
						</div>

						<div className="space-y-4">
							<label className="text-gray-300 text-left block">Company Logo (optional)</label>
							<div className="flex flex-col items-center space-y-4">
								<button 
									type="button"
									onClick={() => inputRef.current?.click()}
									className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 w-full sm:w-auto"
								>
									<ArrowUpTrayIcon className="w-5 h-5" />
									<span>Upload Logo</span>
								</button>
								<input
									ref={inputRef}
									type="file"
									accept="image/*"
									hidden
									onChange={handleImageUpload}
								/>
								
								{previewImage && (
									<div className="flex flex-col items-center space-y-2">
										<div className="relative w-24 h-24 border border-white/20 rounded-xl overflow-hidden">
											<Image
												src={previewImage}
												alt="Company Logo Preview"
												fill
												className="object-cover"
											/>
										</div>
										<button
											type="button"
											onClick={clearUploadedImage}
											className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors text-sm"
										>
											<TrashIcon className="w-4 h-4" />
											<span>Remove</span>
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				</ModernFormStep>
			)}

			{currentStep === totalSteps + 1 && (
				<ModernFormStep
					key="success"
					title="Welcome to LSN!"
					subtitle="Please check your email to verify your company's account"
					currentStep={totalSteps}
					totalSteps={totalSteps}
					onNext={() => {}}
					onBack={() => {}}
					canContinue={false}
					direction={direction}
				>
					<div className="text-center space-y-4">
						<div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
							<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<p className="text-gray-300">
							Registration complete! Check your email for verification.
						</p>
					</div>
				</ModernFormStep>
			)}
			
			<ErrorModal
				isOpen={errorModal.isOpen}
				title={errorModal.title}
				message={errorModal.message}
				onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
			/>
		</AnimatePresence>
	);
}