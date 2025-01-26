'use client'

// for future improvement, move some fields in components to be used with register and other forms

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select'; // For tag selection
import ImageUpload from '@/app/components/account/logo-edit';
import getPredefinedTags from '@/app/lib/utils';
import { OrganiserAccountEditFormData } from '@/app/lib/types';
import { upload } from '@vercel/blob/client';
import { Input } from '../../components/input';
import { Button } from '@/app/components/button';
import { FlagIcon } from '@heroicons/react/24/outline';
import ResumeEmbeddedStripeConnectOnboardingForm from '@/app/components/payments/embedded-onboarding/stripe-connect';


export default function EditDetailsPage() {

	const [predefinedTags, setPredefinedTags] = useState([]);
	const [showStripeEmboarding, setShowStripeEmboarding] = useState<boolean>(false);

	useEffect(() => {
		const fetchTags = async () => {
			const tags = await getPredefinedTags();
			setPredefinedTags(tags);
		};

		fetchTags();
	}, []);

	const { data: session, status } = useSession();
	const router = useRouter();

	const { register, handleSubmit, setValue, control } = useForm<OrganiserAccountEditFormData>({
		mode: 'onSubmit',
		defaultValues: {
			tags: [], // Make sure tags is initialized as an empty array
		},
	});

	const onSubmit = async (data: OrganiserAccountEditFormData) => {

		const toastId = toast.loading('Editing your society\'s account...');

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
			const res = await fetch('/api/user/update-account-fields', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: session?.user?.id, data: data }),
			});

			const result = await res.json()
			if (result.success) {
				toast.success('Society edited succesfully!', { id: toastId })
				router.push('/account')
			} else {
				toast.error(`Error editing account: ${result.error}`, { id: toastId })
				console.error('Error editing account:', result.error)
			}
		} catch (error) {
			toast.error(`Error during account updating: ${error.message}`, { id: toastId })
			console.error('Error during account updating:', error)
		}

	}

	const fetchAccountInfo = useCallback( async (id: string) => {
		try {
			const res = await fetch('/api/user/get-account-fields', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(id),
			});
			const { description, website, tags } = await res.json();
			setValue('description', description);
			setValue('website', website);
			setValue('tags', tags);
		} catch (error) {
			console.error('Error loading account details:', error);
		}
	}, [setValue]);

	useEffect(() => {
		if (status === 'loading') return;

		if (!session) {
			router.push('/login');
		} else {
			fetchAccountInfo(session.user.id);
		}
	}, [session, status, router, fetchAccountInfo]);

	if (status === 'loading') {
		return <div>Loading...</div>;
	}

	if (!session) {
		router.push('/login');
	}

	const { user } = session;

	return (
		<div className="min-h-screen flex flex-col justify-start p-10 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
			<h1 className="text-3xl font-semibold mb-6">Edit Details</h1>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Society Logo</label>
				<ImageUpload register={register} setValue={setValue} id={session?.user?.id} />
			</div>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Name</label>
				<input
					type="text"
					value={user.name}
					disabled
					className="w-full text-gray-400 p-2 border border-gray-300 rounded bg-gray-200/25 cursor-not-allowed"
				/>
			</div>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Email</label>
				<input
					type="email"
					value={user.email}

					disabled
					className="w-full text-gray-400 p-2 border border-gray-300 rounded bg-gray-200/25 cursor-not-allowed"
				/>
			</div>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Role</label>
				<input
					type="text"
					value={user.role}
					disabled
					className="w-full text-gray-400 p-2 border border-gray-300 rounded bg-gray-200/25 cursor-not-allowed"
				/>
			</div>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Description</label>
				<textarea
					id="description"
					rows={4}
					{...register('description')}
					className="w-full text-white block text-sm p-2 border border-gray-300 rounded bg-transparent focus:ring-blue-500 focus:border-blue-500"
					placeholder="Society Description..."
				/>
			</div>
			<div>
				<label className="block text-white font-bold mt-4 mb-1">Website</label>
				<Input
					type="text"
					placeholder="Official Website Link"
					className="w-full text-white p-2 border border-gray-300 rounded bg-transparent"
					{...register('website')}
				/>
			</div>
			<div className='pb-[100px]'>
				<label className="block text-white font-bold mt-4 mb-1">Tags</label>
				<Controller
					name="tags"
					control={control}
					render={({ field }) => (
						<Select
							{...field}
							options={predefinedTags}
							isMulti
							value={field.value.map((tag) => predefinedTags.find((t) => t.value === tag))}
							onChange={(selectedTags) => {
								if (selectedTags.length > 3) {
									toast.error('You can only select up to 3 tags');
									return; // Prevent further selection
								}
								const selectedValues = selectedTags.map((tag) => tag.value);
								field.onChange(selectedValues);
							}}
							getOptionLabel={(e) => e.label}
							getOptionValue={(e) => e.value}
							styles={{
								option: (provided) => ({
									...provided,
									color: 'black',
								}),
							}}
						/>
					)}
				/>
			</div>
			<div className="flex justify-end mt-6 items-center">
				<Button variant='outline' onClick={() => setShowStripeEmboarding(true)} className="p-3 text-white rounded-lg hover:bg-slate-500">
					Register for Stripe Connect <FlagIcon className='ml-2' width={15} height={15} />
				</Button>
			</div>

			{(showStripeEmboarding && session?.user?.id) &&
				<ResumeEmbeddedStripeConnectOnboardingForm userId={session.user.id}/>
			}

			<div>
				{/* Save changes button */}
				<div className="flex justify-end mt-6 items-center">
					<Button variant='outline' onClick={handleSubmit(onSubmit)} className="p-3 text-white rounded-lg hover:bg-slate-500">
						Save changes
					</Button>
				</div>

				{/* Cancel button */}
				<div className="flex justify-end mt-6 items-center">
					<Button variant='outline' onClick={() => router.push('/account')} className="bg-gray-400 text-white px-4 py-2 rounded">
						Cancel
					</Button>
				</div>
			</div>

			<div className="my-5">
				If you would like to change any of the greyed-out fields, please get in touch at hello@londonstudentnetwork.com, and one of the team will be in touch.
			</div>
		</div>
	);
}
