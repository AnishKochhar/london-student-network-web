
export interface Event {
	id: string;
	title: string;
	description: string;
	organiser: string;
	time: string;
	date: string;
	location_building: string;
	location_area: string;
	location_address: string;
	image_url: string;
	event_type: number;
	sign_up_link?: string;
}

export interface SQLEvent {
	id: string;
	title: string;
	description: string;
	organiser: string;
	organiser_uid: string;
	start_time: string;
	end_time: string;
	day: number;
	month: number;
	year: number;
	location_building: string;
	location_area: string;
	location_address: string;
	image_url: string;
	event_type: number;
	sign_up_link?: string;
}

export type User = {
	id: string;
	name: string;
	email: string;
	password: string;
	role: string;
	email_verified: boolean;
}

export interface ContactFormInput {
	id: string
	name: string
	email: string
	message: string
}

export interface FormData {
	title: string;
	description: string;
	organiser: string;
	date: {
		day: number;
		month: number;
		year: number;
	};
	time: {
		startHour: number;
		startMinute: number;
		endHour: number;
		endMinute: number;
	};
	location: {
		building: string;
		area: string;
		address: string;
	};
	selectedImage: string;
	uploadedImage: File | null;
	event_tag: number;
	signupLink?: string;
}

export interface UserRegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstname: string;
	surname: string;
    gender: string;
    dob: string;
    university: string;
	otherUniversity: string;
    graduationYear: string;
    degreeCourse: string;
    levelOfStudy: string;
    hasAgreedToTerms: boolean;
    isNewsletterSubscribed: boolean;
}

export interface SocietyRegisterFormData {
	name: string;
    email: string;
    password: string;
    confirmPassword: string;
    hasAgreedToTerms: boolean;
}


export interface ContactFormInput {
	id: string
	name: string
	email: string
	message: string
}

export interface UserInformation {
	id: string;
	user_id: string;
	gender: string;
	birthdate: string;
	university_attended: string;
	graduation_year: string;
	course_studied: string;
	level_of_study: string;
	newsletter_subscribe: boolean;
}

export const DefaultEvent: Event = {
	id: '',
	title: 'Sample Event',
	description: 'This is a sample description for a default event.',
	organiser: 'Imperial Neurotech Society',
	time: '10:00 - 11:00',
	date: '12/12/2024',
	location_building: 'Lecture Room G40, Sir Alexander Fleming Building',
	location_area: 'Imperial College Campus, South Kensington',
	location_address: 'Prince Consort Road, SW7 2BP',
	image_url: '/images/placeholders/football.jpg',
	event_type: 7, 
	sign_up_link: 'https://google.co.uk',
};