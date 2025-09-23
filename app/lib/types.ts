export interface Event {
    id: string;
    title: string;
    description: string;
    organiser: string;
    time: string; // Legacy field
    date: string; // Legacy field
    location_building: string;
    location_area: string;
    location_address: string;
    image_url: string;
    image_contain: boolean;
    event_type: number;
    capacity?: number;
    sign_up_link?: string;
    for_externals?: string;
    // New timestamp fields
    start_datetime?: string; // PostgreSQL TIMESTAMPTZ
    end_datetime?: string;   // PostgreSQL TIMESTAMPTZ
    is_multi_day?: boolean;
    // Event management fields
    is_hidden?: boolean;
    is_deleted?: boolean;
    send_signup_notifications?: boolean;
    student_union?: boolean;
}

export interface EditEventProps {
    eventProp: Event;
    onClose: () => void;
}

export interface EventModalProps {
    event: Event;
    onClose: () => void;
}

export interface EventCardProps {
    event: Event;
    editEvent?: boolean;
}

export interface EditEventComponentProps {
    event: Event;
}

export interface EmailData {
    id: string;
    email: string;
    subject: string;
    text: string;
}

export interface UserEventsListProps {
    user_id: string;
    editEvent?: boolean;
}

export interface FetchAccountDetailsPromiseInterface {
    logo_url: string;
    description: string;
    website: string;
    tags: number[];
}

export interface SQLEvent {
    id: string;
    title: string;
    description: string;
    organiser: string;
    organiser_uid: string;
    // New datetime fields (primary)
    start_datetime?: string;   // PostgreSQL TIMESTAMPTZ
    end_datetime?: string;     // PostgreSQL TIMESTAMPTZ
    is_multi_day?: boolean;
    // Legacy fields (for backward compatibility, now optional)
    start_time?: string;
    end_time?: string;
    day?: number;
    month?: number;
    year?: number;
    location_building: string;
    location_area: string;
    location_address: string;
    image_url: string;
    image_contain: boolean;
    event_type: number;
    capacity?: number;
    sign_up_link?: string;
    for_externals?: string;
    // Event management fields
    is_hidden?: boolean;
    is_deleted?: boolean;
    send_signup_notifications?: boolean;
    student_union?: boolean;
}

export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    email_verified: boolean;
};

export interface Username {
    id: number;
    user_id: string;
    username: string;
    created_at: string;
    updated_at: string;
}

export interface UsernameFormData {
    username: string;
}

export interface UsernameCheckResponse {
    available: boolean;
    suggestions?: string[];
    error?: string;
}

export interface CreateUsernameRequest {
    username: string;
}

export interface CreateUsernameResponse {
    success: boolean;
    username?: string;
    error?: string;
}

export interface ContactFormInput {
    id: string;
    name: string;
    email: string;
    message: string;
}

export interface FormData {
    title: string;
    description: string;
    organiser: string;
    organiser_uid: string;
    date: {
        day: number;
        month: number;
        year: number;
    };
    time: {
        startHour: string;
        startMinute: string;
        endHour: string;
        endMinute: string;
    };
    location: {
        building: string;
        area: string;
        address: string;
    };
    selectedImage: string;
    uploadedImage: File | null;
    image_contain: boolean;
    event_tag: number;
    capacity?: number;
    signupLink?: string;
    forExternals?: string;
}

export interface EventFormData {
    title: string;
    description: string;
    organiser: string;
    organiser_uid: string;
    start_datetime: string; // Date in YYYY-MM-DD format
    end_datetime: string;   // Date in YYYY-MM-DD format
    start_time: string;     // Time in HH:MM format
    end_time: string;       // Time in HH:MM format
    is_multi_day: boolean;
    location_building: string;
    location_area: string;
    location_address: string;
    image_url: string;
    uploaded_image?: File;
    image_contain: boolean;
    tags: number; // Bitmask for tag selections
    external_forward_email?: string;
    capacity?: number;
    sign_up_link?: string;
    for_externals?: string;
    send_signup_notifications: boolean;
}

export interface SQLEventData {
    title: string;
    description: string;
    organiser: string;
    organiser_uid: string;
    start_datetime: string; // PostgreSQL TIMESTAMPTZ
    end_datetime: string;   // PostgreSQL TIMESTAMPTZ
    is_multi_day: boolean;
    location_building: string;
    location_area: string;
    location_address: string;
    image_url: string;
    image_contain: boolean;
    event_type: number; // Bitmask for tag selections
    external_forward_email?: string;
    capacity?: number;
    sign_up_link?: string;
    for_externals?: string;
    send_signup_notifications: boolean;
    student_union: boolean;
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
    referrer: string;
    societyReferrer: string;
    otherSocietyReferrer: string;
    hasAgreedToTerms: boolean;
    isNewsletterSubscribed: boolean;
}

export interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

export interface SocietyRegisterFormData {
    name: string;
    email: string;
    additionalEmail: string;
    phoneNumber: string;
    password: string;
    university: string;
    otherUniversity: string;
    description: string | null;
    website: string | null;
    tags: Array<string> | null;
    confirmPassword: string;
    hasAgreedToTerms: boolean;
    uploadedImage: File | null;
    imageUrl: string | null;
}

export interface CompanyRegisterFormData {
    companyName: string;
    password: string;
    confirmPassword: string;
    contactEmail: string;
    contactName: string;
    description: string | null;
    website: string | null;
    motivation: Array<string> | null;
    hasAgreedToTerms: boolean;
    uploadedImage: File | null;
    imageUrl: string | null;
}

export interface CompanyInformation {
    id: string;
    company_name: string;
    contact_email: string;
    contact_name: string;
    description: string | null;
    website: string | null;
    motivation: Array<string> | null;
    logo_url: string | null;
    logoBgc?: string; // optional, some logos need white background to be visible
}

export interface OrganiserAccountEditFormData {
    uploadedImage: File | null;
    imageUrl: string | null;
    description: string | null;
    website: string | null;
    tags: Array<string> | null;
}

export type Tag = {
    label: string;
    value: number;
};

export type Partner = {
    id: number;
    name: string;
    tags: number[];
    description: string;
    website: string;
    logo_url: string;
};

export type FormattedPartner = {
    id: number;
    name: string;
    keywords: string[]; // no keywords represented by empty array
    description: string | null; // it really should be enforced to set a description
    website: string | null;
    logo: string | null;
};

export type PartnersProps = {
    setPartners: React.Dispatch<React.SetStateAction<Partner[]>>; // State setter function for partners
    filteredPartners: FormattedPartner[]; // The filtered partners passed as props
};

export interface ContactFormInput {
    id: string;
    name: string;
    email: string;
    message: string;
}

export interface SocietyMessageFormData {
    subject: string;
    message: string;
}

export interface InsertTokenResult {
    success: boolean;
}

export interface LoginPageFormData {
    email: string;
    password: string;
}

export interface EmailPayloadType {
    email: string;
    subject: string;
    text: string;
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

export interface Registrations {
    user_id: string;
    user_name: string;
    user_email: string;
    date_registered: string;
    external: boolean;
}

export interface SQLRegistrations {
    id: string;
    user_id: string;
    event_id: string;
    name: string;
    email: string;
    created_at: string;
    external: boolean;
}

export interface WebsiteStats {
    total_events: string;
    total_universities: string;
    total_societies: string;
}

export interface ForumPost {
    id: number;
    title: string;
    content: string;
    author: string;  // This will now be the username
    authorName?: string;  // Real name (optional, for backward compatibility)
    avatar: string;
    timeAgo: string;
    upvotes: number;
    downvotes: number;
    replies: Reply[];
    replyCount: number;
    tags: string[];
    userVote?: string | null;
    wasEdited?: boolean;
    editedTimeAgo?: string;
    authorId?: string;
}

export interface Reply {
    id: number;
    author: string;  // This will now be the username
    authorName?: string;  // Real name (optional, for backward compatibility)
    avatar: string;
    content: string;
    timeAgo: string;
    upvotes: number;
    downvotes: number;
    userVote?: string | null;
    parent_id?: number | null;
    replyCount?: number;
    wasEdited?: boolean;
    editedTimeAgo?: string;
    authorId: string;
}

export interface ThreadData {
    id: number;
    title: string;
    content: string;
    author: string;  // This will now be the username
    authorName?: string;  // Real name (optional, for backward compatibility)
    avatar: string;
    timeAgo: string;
    upvotes: number;
    downvotes: number;
    replies: Reply[];
    replyCount: number;
    tags: string[];
    userVote?: string | null;
    wasEdited?: boolean;
    editedTimeAgo?: string;
    authorId?: string;
    totalReplies?: number;
}

export interface TrendingTopic {
    name: string;
    count: number;
}

export interface FeaturedUser {
    username: string;
    status: "online" | "featured";
}

export type ViewContext =
    | { type: "thread"; threadId: number }
    | {
          type: "comment";
          threadId: number;
          commentId: number;
          comment: Reply;
          parentComment?: Reply;
      };

export interface ThreadUpdateData {
    title?: string;
    content?: string;
    tags?: string[];
    upvotes?: number;
    downvotes?: number;
    userVote?: "upvote" | "downvote" | null;
    replies?: Reply[];
    replyCount?: number;
    wasEdited?: boolean;
    editedTimeAgo?: string;
}

// Comment/reply update types
export interface CommentUpdateData {
    content?: string;
    upvotes?: number;
    downvotes?: number;
    userVote?: string | null;
    replyCount?: number;
    wasEdited?: boolean;
    editedTimeAgo?: string;
}

export const DefaultEvent: Event = {
    id: "",
    title: "Sample Event",
    description: "This is a sample description for a default event.",
    organiser: "Imperial Neurotech Society",
    time: "10:00 - 11:00",
    date: "12/12/2024",
    location_building: "Lecture Room G40, Sir Alexander Fleming Building",
    location_area: "Imperial College Campus, South Kensington",
    location_address: "Prince Consort Road, SW7 2BP",
    image_url: "/images/placeholders/football.jpg",
    image_contain: true,
    event_type: 7,
    capacity: 150,
    sign_up_link: "https://google.co.uk",
};
