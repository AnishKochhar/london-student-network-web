'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserRegisterFormData } from '@/app/lib/types';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { ArrowLeftIcon, ArrowRightIcon, FlagIcon } from '@heroicons/react/24/outline';
import { LondonUniversities } from '@/app/lib/utils/events';


export default function UserRegistrationForm() {
	const { register, handleSubmit, formState: { errors }, getValues, watch } = useForm<UserRegisterFormData>({
		mode: 'onSubmit'
	});
	const [step, setStep] = useState<number>(1);
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [organisers, setOrganisers] = useState([]);
	const totalSteps = 6;

	const currentYear = new Date().getFullYear();
	const graduationYears = Array.from({ length: 11 }, (_, i) => currentYear + i);

	const nextStep = () => {
		if (step < totalSteps) setStep(step + 1);
	};

	const prevStep = () => {
		if (step > 0) setStep(step - 1);
	};

	const calculateProgress = () => {
		return ((step) / (totalSteps)) * 100;
	};

	const fetchOrganisersData = async () => {
		try {
			const response = await fetch('/api/organisers');
			if (response.ok) {
				const data = await response.json();
				setOrganisers(data);
			} else {
				console.error('Failed to fetch organisers:', response.statusText);
			}
		} catch (error) {
			console.error('Error fetching organisers:', error);
		}
	}

	const onSubmit = async (data: UserRegisterFormData) => {
		const toastId = toast.loading('Creating user...');
		const email = data.email;

		try {
			const res = await fetch('/api/user/check-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const result = await res.json();
			if (result.emailTaken) {
				toast.error('Email already exists.', { id: toastId });
				return;
			}

		} catch (error) {
			toast.error('Error checking email.', { id: toastId });
			return;
		}

		try {
			const res = await fetch('/api/user/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await res.json();

			if (result.success) {
				toast.success('User successfully created!', { id: toastId });
				nextStep();
				sendVerificationEmail(data)
			} else {
				toast.error(`Error creating user: ${result.error}`, { id: toastId });
				console.error('Error creating user:', result.error);
			}
		} catch (error) {
			toast.error(`Error during user creation: ${error.message}`, { id: toastId });
			console.error('Error during user creation:', error);
		}
	};

	const sendVerificationEmail = async (data: UserRegisterFormData) => {
		try {
			const email = data.email;
			const response = await fetch('/api/email/send-verification-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
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

	useEffect(() => {
		fetchOrganisersData();
	}, []);


	// Step 0 and 1: Email and Password
	const CombinedEmailPasswordEntry = () => (

		<div className='flex flex-col w-full'>
			<h2 className="text-4xl font-semibold mb-16">Let&#39;s create your account</h2>
			<p className="mt-4  text-gray-300">Please register an email address</p>

			<Input
				type="email"
				placeholder="Email"
				className="w-full mt-4 bg-transparent"
				{...register('email', { required: 'Email is required.' })}
			/>
			{errors.email && <p className="text-red-500 mt-2">{errors.email.message}</p>}

			<p className="mt-10 text-gray-300">Please set a <i>strong</i> password for your account</p>

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

			{/* Newsletter Subscription (optional) */}
			<div className="mt-2">
				<label className="flex items-start">
					<input type="checkbox" className="mr-2 mt-1" {...register('isNewsletterSubscribed')} />
					<span>Subscribe to our newsletter and communications</span>
				</label>
			</div>

			{/* Continue button */}
			<div className="flex justify-end mt-6 items-center">
				<Button variant='outline' onClick={handleSubmit(nextStep)} className="p-3 text-white rounded-lg hover:bg-slate-500">
					Continue <ArrowRightIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>
		</div>
	)

	// Step 2: User Information
	const PersonalInformationEntry = () => (
		<div>
			<h2 className="text-4xl font-semibold">Tell us a bit about yourself!</h2>
			<p className="mt-4 text-gray-400">Let&#39;s get started</p>

			<div className="flex flex-row space-x-4">
				<Input
					type="text"
					placeholder="First Name"
					className="w-full mt-4 bg-transparent"
					{...register('firstname', { required: 'First Name is required.' })}
				/>
				<Input
					type="text"
					placeholder="Last Name"
					className="w-full mt-4 bg-transparent"
					{...register('surname', { required: 'Last Name is required.' })}
				/>
			</div>
			<select
				id="gender"
				className="w-full mt-4 p-2 rounded-lg bg-transparent border border-gray-300"
				{...register('gender', { required: 'Gender is required.' })}
			>
				<option key='default' value="">Select gender</option>
				<option key='female' value="Female">Female</option>
				<option key='male' value="Male">Male</option>
				<option key='other' value="Other">Prefer not to say</option>
			</select>
			<input
				type="date"
				className="w-full mt-4 p-2 rounded-lg text-white bg-transparent border border-gray-300"
				{...register('dob', { required: 'Date of Birth is required.' })}
			/>
			{errors.firstname && <p className="text-red-500 mt-2">{errors.firstname.message}</p>}
			{errors.surname && <p className="text-red-500 mt-2">{errors.surname.message}</p>}
			{errors.gender && <p className="text-red-500 mt-2">{errors.gender.message}</p>}
			{errors.dob && <p className="text-red-500 mt-2">{errors.dob.message}</p>}

			<div className="flex justify-between mt-6">
				<Button variant='outline' onClick={prevStep} className="p-3 bg-transparent">
					<ArrowLeftIcon className='mr-2' width={15} height={15} /> Back
				</Button>
				<Button variant='outline' onClick={handleSubmit(nextStep)} className="self-end mt-3 p-3 text-white rounded-lg hover:bg-slate-500">
					Continue <ArrowRightIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>
		</div>
	);

	// Step 3: University and Graduation
	const UniversityEntry = () => {
		const [isOtherSelected, setIsOtherSelected] = useState(false);
		const selectedUniversity = watch('university')

		useEffect(() => {
			if (selectedUniversity === 'Other (please specify)') {
				setIsOtherSelected(true)
			} else {
				setIsOtherSelected(false)
			}
		}, [selectedUniversity])

		return (
			<div>
				<h2 className="text-4xl mb-10 font-semibold">Where are you studying?</h2>
				<select
					className="w-full mt-4 p-2 rounded-lg bg-transparent border border-gray-300 text-sm"
					{...register('university', { required: 'University is required.' })}
				>
					<option value="" className="text-gray-300">Select Institution</option>
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
						{...register('otherUniversity', { required: 'Other university is required.' })}
					/>

				)}

				<select
					className="w-full mt-4 p-2 rounded-lg bg-transparent border border-gray-300 text-sm"
					{...register('graduationYear', { required: 'Graduation Year is required.' })}
				>
					<option value="" className='text-gray-300'>Select Graduation Year</option>
					{graduationYears.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>

				{errors.university && <p className="text-red-500 mt-2">{errors.university.message}</p>}
				{errors.otherUniversity && <p className="text-red-500 mt-2">{errors.otherUniversity.message}</p>}
				{errors.graduationYear && <p className="text-red-500 mt-2">{errors.graduationYear.message}</p>}

				<div className="flex justify-between mt-6">
					<Button variant='outline' onClick={prevStep} className="p-3 bg-transparent">
						<ArrowLeftIcon className='mr-2' width={15} height={15} /> Back
					</Button>
					<Button variant='outline' onClick={handleSubmit(nextStep)} className="self-end mt-3 p-3 text-white rounded-lg hover:bg-slate-500">
						Continue <ArrowRightIcon className='ml-2' width={15} height={15} />
					</Button>
				</div>
			</div>
		)
	};

	// Step 4: Degree and Study Level
	const CourseInformationField = () => (
		<div>
			<h2 className="text-4xl font-semibold">What are you studying?</h2>
			<p className="mt-4 mb-10 text-gray-400">Underwater basket weaving is allowed</p>

			<Input
				type="text"
				placeholder="Degree Course"
				className="w-full mt-4 p-4 bg-transparent"
				{...register('degreeCourse', { required: 'Degree Course is required.' })}
			/>
			<select
				className="w-full mt-4 p-3 rounded-lg bg-transparent border border-gray-300 text-sm"
				{...register('levelOfStudy', { required: 'Level of Study is required.' })}
			>
				<option value="">Level of Study</option>
				<option value="Undergraduate">Undergraduate</option>
				<option value="Postgraduate">Postgraduate</option>
				<option value="Doctoral">PhD</option>
				<option value="Alumni">Alumni</option>
				<option value="Other">Other</option>
			</select>
			{errors.degreeCourse && <p className="text-red-500 mt-2">{errors.degreeCourse.message}</p>}
			{errors.levelOfStudy && <p className="text-red-500 mt-2">{errors.levelOfStudy.message}</p>}

			<div className="flex justify-between mt-6">
				<Button variant='outline' onClick={prevStep} className="p-3 bg-transparent">
					<ArrowLeftIcon className='mr-2' width={15} height={15} /> Back
				</Button>
				<Button variant='outline' onClick={handleSubmit(nextStep)} className="self-end mt-3 p-3 text-white rounded-lg hover:bg-slate-500">
					Continue <ArrowRightIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>
		</div>
	);

	// Step 5: Referral
	const ReferredDetails = () => (
		<div>
			<p className="font-semibold mb-8">If you were referred from one of our partner societies, please select them here</p>

			<select
				id="referrer"
				className="w-full p-3 rounded-lg bg-transparent border border-gray-300 text-sm text-white"
				{...register('referrer')}
			>
				<option value="">None</option>
				{organisers.map((organiser) => (
					<option key={organiser} value={organiser}>
						{organiser}
					</option>
				))}
			</select>

			<div className="flex justify-between mt-6">
				<Button variant='outline' onClick={prevStep} className="p-3 bg-transparent">
					<ArrowLeftIcon className='mr-2' width={15} height={15} /> Back
				</Button>
				<Button variant='outline' onClick={handleSubmit(onSubmit)} className="self-end mt-3 p-3 text-white rounded-lg hover:bg-slate-500">
					Submit <FlagIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>
		</div>
	)


	return (
		<main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">

			<div className="w-screen p-12 md:px-28">

				{step === 1 && <CombinedEmailPasswordEntry />}
				{step === 2 && <PersonalInformationEntry />}
				{step === 3 && <UniversityEntry />}
				{step === 4 && <CourseInformationField />}
				{step === 5 && <ReferredDetails />}


				{step === totalSteps && (
					<div className="text-center items-center flex flex-col">
						<h2 className="text-4xl font-semibold">Thank you for registering!</h2>
						<p className="mt-4 text-gray-300">Please verify your email with the link we sent for full access to the LSN.</p>
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
