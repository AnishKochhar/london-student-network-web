"use client";

import Image from 'next/image';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { Input } from '../input';
import { Button } from '../button';
import { generateDays, generateMonths, generateYears, generateHours, generateMinutes } from '@/app/lib/utils/time';
import { placeholderImages } from '@/app/lib/utils/events';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import EventModal from "./event-modal";
import { createEventObject } from '@/app/lib/utils/type-manipulation';
import { validateEvent } from '@/app/lib/utils/events';
import { DefaultEvent, FormData } from '@/app/lib/types';
import TagsField from './create-event-tags';
import { upload } from '@vercel/blob/client';
import ToggleSwitch from '../toggle-button';
import * as TableComponents from '../table';


const MAX_POSTGRES_STRING_LENGTH = 255;

interface CreateEventPageProps {
	organiser_id: string
	organiserList: string[]
}

export default function CreateEventPage({ organiser_id, organiserList }: CreateEventPageProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [eventData, setEventData] = useState(DefaultEvent); // Event data for preview

	const { control, register, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<FormData>({
		mode: 'onChange',
	});

	const openModal = () => setIsModalOpen(true);
	const closeModal = () => setIsModalOpen(false);
	const router = useRouter()

	const eventTagValue = watch('event_tag', 0); // Default value is 0
	setValue('organiser_uid', organiser_id)

	const onSubmit = async (data: FormData) => {
		const toastId = toast.loading('Uploading event...')
		const error = validateEvent(data);

		if (error) {
			toast.error(`Event is invalid: ${error}`, { id: toastId })
			return;
		}

		let imageUrl = data.selectedImage

		if (data.uploadedImage && typeof data.uploadedImage !== 'string') { // this truly should be happening in the backend. TODO
			try {
				const newBlob = await upload(data.uploadedImage.name, data.uploadedImage, {
					access: 'public',
					handleUploadUrl: '/api/upload-image',
				})

				imageUrl = newBlob.url
			} catch (error) {
				toast.error(`Error uploading image: ${error.message}`, { id: toastId })
				return
			}
		}

		try {
			const res = await fetch('/api/events/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...data,
					selectedImage: imageUrl
				}),
			});

			const result = await res.json();
			if (result.message === 'success') {
				toast.success('Event successfully created!', { id: toastId })
				router.push('/events');
			} else {
				toast.error(`Error creating event: ${result.message}.`, { id: toastId })
			}
		} catch (error) {
			toast.error(`Error during event submission: ${error}.`, { id: toastId })
		}
	};

	const onPreview = (data: FormData) => {
		const error = validateEvent(data);

		if (error) {
			toast.error(`Invalid event entry: ${error}`)
			return
		}

		let imageUrl = data.selectedImage
		if (data.uploadedImage) {
			imageUrl = URL.createObjectURL(data.uploadedImage)
		}

		const event = createEventObject({
			...data,
			selectedImage: imageUrl
		});

		setEventData(event);
		openModal();
	};


	// Components for each form field
	const TitleField = () => (
		<div className="flex flex-col mb-4">
			<label htmlFor="title" className="text-2xl p-6 font-semibold">Title</label>
			{errors.title && <p className="text-red-600 text-sm self-end mb-1">Title is required (max 255 characters)</p>}
			<Input
				placeholder="e.g. Andreas Schaefer: From X-Rays to BCIs..."
				{...register('title', { required: true, maxLength: MAX_POSTGRES_STRING_LENGTH })}
				className="bg-transparent border border-gray-300 self-end truncate w-[90%] p-2"
				maxLength={MAX_POSTGRES_STRING_LENGTH}
			/>
		</div>
	);


	const DescriptionField = () => (
		<div className="flex flex-col mb-4">
			<label htmlFor="description" className="text-2xl p-6 font-semibold">Description</label>
			{errors.description && <p className="text-red-600 text-sm self-end mb-1">Description is required</p>}
			<textarea
				id="description"
				rows={4}
				{...register('description', { required: true })}
				className="w-[90%] self-end block p-3 text-sm  text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
				placeholder="Please provide information about your event..."
			/>

		</div>
	)


	const OrganiserField = () => (
		<div className="flex flex-col mb-4">
			<label htmlFor="organiser" className="text-2xl p-6 font-semibold">Organiser</label>
			<select
				id="organiser"
				{...register('organiser', { required: true })}
				className="border border-gray-300 p-4 text-sm w-[90%] self-end bg-transparent rounded-lg"
			>
				<option value="" disabled>Select an organiser</option>
				{organiserList.map((org) => (
					<option key={org} value={org}>{org}</option>
				))}
			</select>
			{errors.organiser && <p className="text-red-600">Organiser is required</p>}
		</div>
	);

	
	const DateField = () => {
		const days = generateDays();
		const months = generateMonths();
		const years = generateYears(2024, 10); // Start from 2024 and allow 10 years

		const today = new Date();
		const currentDay = today.getDate();
		const currentMonth = today.getMonth() + 1;
		const currentYear = today.getFullYear();

		return (
			<div className="flex flex-col space-x-2 mb-4">
				<label htmlFor="date" className="text-2xl p-6 font-semibold">Date</label>
				<div className="flex flex-row justify-end self-end w-auto p-2 space-x-2 ">

					<div className="flex flex-col p-2">
						<label className="text-sm font-semibold">Day</label>
						<select {...register('date.day', { required: true })} className="w-full bg-transparent" defaultValue={currentDay} >
							<option value="" disabled>Select Day</option>
							{days.map(day => (
								<option key={day} value={day}>{day}</option>
							))}
						</select>
					</div>


					<div className="flex flex-col p-2">
						<label className="text-sm font-semibold">Month</label>
						<select {...register('date.month', { required: true })} className="w-full bg-transparent" defaultValue={currentMonth}>
							<option value="" disabled>Select Month</option>
							{months.map((month, index) => (
								<option key={index} value={index + 1}>{month}</option>
							))}
						</select>
					</div>


					<div className="flex flex-col p-2">
						<label className="text-sm font-semibold">Year</label>
						<select {...register('date.year', { required: true })} className="w-full bg-transparent" defaultValue={currentYear}>
							<option value="" disabled>Select Year</option>
							{years.map(year => (
								<option key={year} value={year}>{year}</option>
							))}
						</select>
					</div>
				</div>
			</div>
		)
	}


	const TimeField = () => {
		const hours = generateHours();
		const minutes = generateMinutes();

		return (
			<div className="flex flex-col mb-4">
				<label htmlFor="time" className="text-2xl p-6 font-semibold">Time</label>
				<div className="flex flex-col sm:flex-row justify-end w-auto self-end p-2 space-x-2">

					<div className="flex flex-col items-center p-2">
						<label className="text-sm font-semibold mb-1 text-center w-full">Start Time</label>
						<div className="flex space-x-2">
							<select {...register('time.startHour', { required: true })} className="bg-transparent text-center" defaultValue={12}>
								<option value="" disabled>Select Hour</option>
								{hours.map(hour => (
									<option key={hour} value={hour}>{hour}</option>
								))}
							</select>
							<select {...register('time.startMinute', { required: true })} className="bg-transparent text-center">
								<option value="" disabled>Select Minute</option>
								{minutes.map(minute => (
									<option key={minute} value={minute}>{minute}</option>
								))}
							</select>
						</div>
					</div>


					<div className="flex flex-col items-center sm:border-l-2 border-gray-300 p-2">
						<label className="text-sm font-semibold mb-1 text-center w-full">End Time</label>
						<div className="flex space-x-2">
							<select {...register('time.endHour', { required: true })} className="bg-transparent text-center" defaultValue={14}>
								<option value="" disabled>Select Hour</option>
								{hours.map(hour => (
									<option key={hour} value={hour}>{hour}</option>
								))}
							</select>
							<select {...register('time.endMinute', { required: true })} className="bg-transparent text-center">
								<option value="" disabled>Select Minute</option>
								{minutes.map(minute => (
									<option key={minute} value={minute}>{minute}</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>
		)
	}


	const TagsFieldWrapper = () => {
		register('event_tag')

		return (
			<TagsField
				value={eventTagValue}
				onChange={(newTagValue: number) => setValue('event_tag', newTagValue)}
			/>
		);
	};


	const ImagePickerField = () => {
		const [uploadedImage, setUploadedImage] = useState<File | null>(null)
		const [previewImage, setPreviewImage] = useState<string | null>(null)

		const selectedImage = watch('selectedImage', '/images/placeholders/lecture-hall-1.jpg')
		const formUploadedImage = watch('uploadedImage')

		const inputRef = useRef<HTMLInputElement>(null)

		register('uploadedImage');
		const imageContain = watch('image_contain', false)


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
			setUploadedImage(null);
			setValue('uploadedImage', null);
			setPreviewImage(null);
			setValue('selectedImage', selectedImage); // Return to selected placeholder image
		}

		useEffect(() => {
			if (formUploadedImage) {
				setUploadedImage(formUploadedImage)
				setPreviewImage(URL.createObjectURL(formUploadedImage))
			} else if (!uploadedImage) {
				setPreviewImage(selectedImage)
			}
		}, [formUploadedImage, selectedImage, uploadedImage]);

		return (
			<div className="flex flex-col mb-4">
				<label className="text-2xl p-6 font-semibold">Image</label>
				<div className='flex flex-col w-[50%] self-end'>
					<p className='text-sm self-end text-gray-500 mb-2'>Please choose from one of our placeholders</p>
					<select
						className="p-3 text-sm w-full bg-transparent border border-gray-300"
						{...register('selectedImage', { required: !uploadedImage })}
					>
						<option value="" disabled>Select an image</option>
						{placeholderImages.map((image, index) => (
							<option key={index} value={image.src} >{image.name}</option>
						))}
					</select>


					<div className='self-end flex flex-col w-full'>
												<Button variant="outline" size="sm" onClick={handleButtonClick} className="my-2 self-end w-fit">
							... or upload your own
						</Button>
						<input
							ref={inputRef}
							type='file'
							accept='image/*'
							hidden
							onChange={handleImageUpload}
						/>


						<div className="self-end relative w-full min-w-[100px] h-[200px] border border-black overflow-hidden">
							<Image
								src={previewImage || selectedImage}
								alt={selectedImage}
								fill
								className={`w-[90%] h-64 border-2 border-black/70 ${imageContain ? 'object-contain' : 'object-cover'}`}
							/>
						</div>
						{uploadedImage && (
							<Button
								variant='ghost'
								className='self-end text-sm text-red-600 hover:text-red-900'
								onClick={clearUploadedImage}
							>
								<TrashIcon width={10} height={10} className='mr-1' />
								Clear uploaded image
							</Button>
						)}

						<hr className="border-t-1 border-gray-300 mt-6" />

						<ToggleSwitch
							label="Switch between 'Cover' and 'Contain' where your event's image is displayed"
							registerField={register('image_contain')}
						/>
					</div>
				</div>
			</div>
		)
	};


	const LocationField = () => (
		<div className="flex flex-col mb-4">
			<label className="text-2xl p-6 font-semibold mb-2">Location</label>

			<div className="flex flex-col mb-4 w-full">
				<label htmlFor="building" className="text-md font-semibold mb-2 ml-10">Building</label>
				<Input
					placeholder="e.g. Lecture Room G40, Sir Alexander Fleming Building"
					{...register('location.building', { maxLength: MAX_POSTGRES_STRING_LENGTH, required: true })}
					className="bg-transparent self-end truncate w-[80%] p-2 border border-gray-300"
				/>
			</div>

			<div className="flex flex-col mb-4 w-full">
				<label htmlFor="area" className="text-md font-semibold mb-2 ml-10">Area of London</label>
				<Input
					placeholder="e.g. Imperial College Campus, South Kensington"
					{...register('location.area', { maxLength: MAX_POSTGRES_STRING_LENGTH, required: true })}
					className="bg-transparent self-end truncate w-[80%] p-2 border border-gray-300"
				/>
			</div>

			<div className="flex flex-col mb-4 w-full">
				<label htmlFor="address" className="text-md font-semibold mb-2 ml-10">Address</label>
				<Input
					placeholder="e.g. 12 Prince Consort Road, SW7 2BP"
					{...register('location.address', { maxLength: MAX_POSTGRES_STRING_LENGTH, required: true })}
					className="bg-transparent self-end truncate w-[80%] p-2 border border-gray-300"
				/>
			</div>
		</div>
	);


	// const CapacityField = () => ( // turn this and below field into a tickets section, that captures ticket name, ticket price, and ticket availability
	// 	<div className="flex flex-col mb-4">
	// 		<label htmlFor="capacity" className="text-2xl p-6 font-semibold">Ticketing Capacity</label>
	// 		{errors.capacity && <p className="text-red-600 text-sm self-end mb-1">Capacity must be a number</p>}
	// 		<input
	// 			id="capacity"
	// 			type="number"
	// 			{...register('capacity', { required: false })}
	// 			className="w-[90%] self-end block p-3 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
	// 			placeholder="No ticketing limit imposed"
	// 		/>
	// 	</div>
	// );


	// const TicketPriceField = () => (
	// 	<div className="flex flex-col mb-4">
	// 	<label htmlFor="tickets price" className="text-2xl p-6 font-semibold">Tickets price</label>
	// 	{errors.tickets_price && <p className="text-red-600 text-sm self-end mb-1">Please enter valid price</p>}
	// 	<Input
	// 		id='tickets_price'
	// 		placeholder="4.99"
	// 		{...register('tickets_price', { required: false, maxLength: MAX_POSTGRES_STRING_LENGTH })}
	// 		className="bg-transparent border border-gray-300 self-end truncate w-[90%] p-2"
	// 		maxLength={MAX_POSTGRES_STRING_LENGTH}
	// 	/>
	// 	</div>
	// );

	const { fields, append, remove } = useFieldArray({
		control,
		name: "tickets_info",
	});

	const TicketFields = () => (
	<div className="mb-8">
		<div className="flex justify-between items-center mb-4">
		<h2 className="text-2xl p-6 font-semibold">Tickets</h2>
				<Button
			type="button"
			variant="filled"
			onClick={() => {
				// const currentTickets = watch("tickets_info");
				// console.log(currentTickets);
				append({ ticketName: "", price: null, capacity: null });
			}}
		>
			Add Ticket
		</Button>
		</div>

		<TableComponents.Table>
		<TableComponents.TableHeader>
			<TableComponents.TableRow>
			<TableComponents.TableHead className="w-[35%]">Ticket Name</TableComponents.TableHead>
			<TableComponents.TableHead className="w-[25%]">Price (£)</TableComponents.TableHead>
			<TableComponents.TableHead className="w-[25%]">Tickets Available</TableComponents.TableHead>
			<TableComponents.TableHead className="w-[15%]">Actions</TableComponents.TableHead>
			</TableComponents.TableRow>
		</TableComponents.TableHeader>
		<TableComponents.TableBody>
			{fields.map((field, index) => (
			<TableComponents.TableRow key={field.id}>
				<TableComponents.TableCell>
				<input
					{...register(`tickets_info.${index}.ticketName`, {
					required: "Name is required",
					pattern: {
						value: /^[a-zA-Z0-9 ]+$/,
						message: "Only letters, numbers and spaces allowed",
					},
					})}
					className="w-full p-2 border rounded"
					placeholder="Standard Ticket"
				/>
				{errors.tickets_info?.[index]?.ticketName && (
					<p className="text-red-500 text-sm mt-1">
					{errors.tickets_info[index]?.ticketName?.message}
					</p>
				)}
				</TableComponents.TableCell>

				<TableComponents.TableCell>
				<input
					type="number"
					step="0.01"
					{...register(`tickets_info.${index}.price`, {
					min: {
						value: 0,
						message: "Price must be non-negative",
					},
					validate: (value) =>
						value === null || value >= 0,
					})}
					className="w-full p-2 border rounded"
					placeholder="For free tickets, enter 0 or leave empty"
				/>
				{errors.tickets_info?.[index]?.price && (
					<p className="text-red-500 text-sm mt-1">
					{errors.tickets_info[index]?.price?.message}
					</p>
				)}
				</TableComponents.TableCell>

				<TableComponents.TableCell>
				<input
					type="number"
					{...register(`tickets_info.${index}.capacity`, {
					min: {
						value: 0,
						message: "Must be non-negative integer",
					},
					validate: (value) =>
						value === null || Number.isInteger(Number(value)),
					})}
					className="w-full p-2 border rounded"
					placeholder="Leave empty if no capacity problems expected"
				/>
				{errors.tickets_info?.[index]?.capacity && (
					<p className="text-red-500 text-sm mt-1">
					{errors.tickets_info[index]?.capacity?.message}
					</p>
				)}
				</TableComponents.TableCell>

				<TableComponents.TableCell>
								<Button
					type="button"
					variant="ghost"
					onClick={() => remove(index)}
					className="text-red-500 hover:text-red-700"
				>
					Remove
				</Button>
				</TableComponents.TableCell>
			</TableComponents.TableRow>
			))}
		</TableComponents.TableBody>
		</TableComponents.Table>
	</div>
	);

	const VerificationMethod = () => (
		<div className="flex flex-col mb-4">
			<label className='flex flex-row items-center'><p className='text-2xl p-6 font-semibold'>Choose verification method</p> <p className='text-lg p-2'>(optional)</p></label>
			<textarea
				id="forExternals"
				rows={4}
				{...register('forExternals')}
				className="w-[90%] self-end block p-3 text-sm  text-black bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
				placeholder="For now, all attendees just get a confirmation email. In the near future, all attendees would get a qr code. You can choose to just verify by confirmation email, or the more robust method, ensure a verifier is logged in to your LSN society account, and scans the qr codes with the coming scanner app that will be found on your LSN account details."
				disabled
			/>
		</div>
	);


	const SignupLinkField = () => (
		<div className="flex flex-col mb-4">
			<label className='flex flex-row items-center'><p className='text-2xl p-6 font-semibold'>Sign-up link</p> <p className='text-lg p-2'>(optional)</p></label>
			<Input
				type="url"
				{...register('signupLink')}
				className="w-[90%] self-end bg-transparent p-2 border border-gray-300"
				placeholder='e.g. https://www.tickettailor.com/events/londonstudentnetwork/1386868'
			/>
		</div>
	);


	const ForExternalsField = () => (
		<div className="flex flex-col mb-4">
			<label className='flex flex-row items-center'><p className='text-2xl p-6 font-semibold'>Please provide any information for external students</p> <p className='text-lg p-2'>(optional)</p></label>
			{errors.description && <p className="text-red-600 text-sm self-end mb-1">Description is required</p>}
			<textarea
				id="forExternals"
				rows={4}
				{...register('forExternals')}
				className="w-[90%] self-end block p-3 text-sm  text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
				placeholder="How to get building access for the event, dress code, event rules, etc..."
			/>
		</div>
	);



	return (
		<div className="relative bg-white p-10 overflow-auto text-black">
			<div className="sticky top-0 bg-gray-300 p-4 border-b flex justify-between items-center rounded-lg">
				<Button variant='ghost' size='sm' className='text-lg hover:text-gray-500' onClick={() => router.back()}>
					<ArrowLeftIcon width={30} height={30} />Back
				</Button>

				<div className="space-x-0 space-y-2 md:space-y-0 md:space-x-4 flex flex-col md:flex-row items-center">
					<Button
						variant="outline"
						size="sm"
						disabled={!isValid}
						className='px-10 bg-purple-400 text-gray-950 md:text-xl'
						onClick={handleSubmit(onPreview)}
					>
						Preview
					</Button>
					<Button
						className='px-10 md:text-xl border-black'
						variant="outline"
						size="sm"
						disabled={!isValid}
						onClick={handleSubmit(onSubmit)}
					>
						Submit
					</Button>
				</div>
			</div>

			<form className="space-y-4">
				<h1 className="text-4xl font-semibold p-6">Let&#39;s create an event!</h1>
				<p className="text-sm text-gray-600 pl-6">Tell us a little about your event</p>

				<TitleField />
				<DescriptionField />
				<OrganiserField />
				<DateField />
				<TimeField />
				<TagsFieldWrapper />
				<LocationField />
				<TicketFields />
				<VerificationMethod />
				<ImagePickerField />
				<SignupLinkField />
				<ForExternalsField />
			</form>

			{isModalOpen && <EventModal event={eventData} onClose={closeModal} />}
		</div>
	);
}
