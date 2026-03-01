export interface Event {
    id: string;
    title: string;
    description: string;
    organiser: string;
    organiser_uid?: string; // Added for logo fetching
    organiser_slug?: string; // Added for society page links
    organiser_university?: string; // University code for filtering (e.g., 'imperial', 'ucl')
    time: string; // Legacy field
    date: string; // Legacy field
    location_building: string;
    location_area: string;
    location_address: string;
    image_url: string;
    image_contain: boolean;
    event_type: number;
    external_forward_email?: string;
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
    // Access control fields
    visibility_level?: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    registration_level?: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    allowed_universities?: string[];
    // Registration cutoff fields
    registration_cutoff_hours?: number | null; // Hours before event when ALL registrations close
    external_registration_cutoff_hours?: number | null; // Hours before event when EXTERNAL registrations close
    // Tickets and registration
    tickets?: unknown[]; // Tickets for this event (from get-information API)
    isRegistered?: boolean; // Whether the current user is registered (from get-information API)
    has_paid_tickets?: boolean; // Whether this event has paid tickets
    // Co-hosting
    co_hosts?: EventCoHost[]; // Co-hosts for this event (from get-information API)
}

// Co-hosting types
export interface EventCoHost {
    user_id: string;
    role: 'primary' | 'cohost';
    status: 'pending' | 'accepted' | 'declined';
    display_order: number;
    is_visible: boolean;
    can_edit: boolean;
    can_manage_registrations: boolean;
    can_manage_guests: boolean;
    can_view_insights: boolean;
    receives_registration_emails: boolean;
    receives_summary_emails: boolean;
    receives_payments: boolean;
    // Enriched fields from JOINs
    name?: string;
    logo_url?: string;
    slug?: string;
    university_affiliation?: string;
    stripe_charges_enabled?: boolean;
    stripe_payouts_enabled?: boolean;
}

export interface CoHostSearchResult {
    user_id: string;
    name: string;
    logo_url: string | null;
    university_affiliation: string | null;
    slug: string | null;
}

export interface CoHostFormSelection {
    user_id: string;
    name: string;
    logo_url: string | null;
    can_edit: boolean;
    can_manage_registrations: boolean;
    can_manage_guests: boolean;
    can_view_insights: boolean;
    receives_registration_emails: boolean;
    receives_summary_emails: boolean;
    receives_payments: boolean;
}

export interface CoHostPermissions {
    can_edit: boolean;
    can_manage_registrations: boolean;
    can_manage_guests: boolean;
    can_view_insights: boolean;
}

export interface EditEventProps {
    eventProp: Event;
    onClose: () => void;
}

export interface EventModalProps {
    event: Event;
    onClose: () => void;
    isRegistered?: boolean;
    onRegistrationChange?: () => void;
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
    organiser_slug?: string; // From JOIN with society_information
    organiser_university?: string; // From JOIN with society_information (university_affiliation)
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
    external_forward_email?: string;
    capacity?: number;
    sign_up_link?: string;
    for_externals?: string;
    // Event management fields
    is_hidden?: boolean;
    is_deleted?: boolean;
    send_signup_notifications?: boolean;
    student_union?: boolean;
    // Access control fields
    visibility_level?: string; // 'public' | 'students_only' | 'verified_students' | 'university_exclusive'
    registration_level?: string; // 'public' | 'students_only' | 'verified_students' | 'university_exclusive'
    allowed_universities?: string[];
    // Registration cutoff fields
    registration_cutoff_hours?: number | null;
    external_registration_cutoff_hours?: number | null;
}

export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    email_verified: boolean;
    verified_university?: string | null;
    last_login?: string; // TIMESTAMPTZ from database
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
    // Access control fields
    visibility_level: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    registration_level: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    allowed_universities?: string[]; // Array of university codes (e.g., ['imperial', 'ucl'])
    // Registration cutoff fields
    registration_cutoff_hours?: number | null; // Hours before event when ALL registrations close
    external_registration_cutoff_hours?: number | null; // Hours before event when EXTERNAL registrations close
    // Co-hosting
    cohosts?: CoHostFormSelection[]; // Co-hosts to invite when creating/editing
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
    // Access control fields
    visibility_level: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    registration_level: string; // 'public' | 'students_only' (all logged-in users) | 'verified_students' | 'university_exclusive'
    allowed_universities?: string[];
    // Registration cutoff fields
    registration_cutoff_hours?: number | null; // Hours before event when ALL registrations close
    external_registration_cutoff_hours?: number | null; // Hours before event when EXTERNAL registrations close
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
    // University verification fields
    accountType?: "student" | "alumni" | "staff" | "external";
    universityEmail?: string;
}

export interface OtherRegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstname: string;
    surname: string;
    hasAgreedToTerms: boolean;
    // Affiliation fields
    accountType: "alumni" | "staff" | "prospective" | "parent" | "educator" | "professional" | "community" | "external";
    otherAccountType?: string; // If accountType is "external"
    universityEmail?: string; // Optional for verification
    wantsUniversityVerification: boolean;
    // Optional university affiliation (self-reported)
    university?: string;
    otherUniversity?: string;
}

export interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

export interface SocietyRegisterFormData {
    name: string;
    slug: string; // URL-friendly slug (auto-generated from name, user-editable)
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
    tags: Array<number> | null;
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
    slug?: string; // URL-friendly slug for society pages
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
    event_registration_uuid: string;
    user_id: string;
    user_name: string;
    user_email: string;
    date_registered: string;
    external: boolean;
    quantity?: number;
    ticket_name?: string;
    ticket_price?: string;
    payment_required?: boolean;
    payment_id?: string;
    payment_status?: string;
    is_cancelled?: boolean;
    cancelled_at?: string;
}

export interface SQLRegistrations {
    id: string;
    event_registration_uuid: string;
    user_id: string;
    event_id: string;
    name: string;
    email: string;
    created_at: string;
    external: boolean;
    quantity?: number;
    ticket_name?: string;
    ticket_price?: string;
    payment_required?: boolean;
    payment_id?: string;
    payment_status?: string;
    is_cancelled?: boolean;
    cancelled_at?: string;
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

// Donation types
export interface DonationConfig {
    enabled: boolean;
    presetAmounts: number[]; // In pence (e.g., [100, 300, 500] for £1, £3, £5)
}

export interface DonationSelection {
    amount: number; // In pence
    isCustom: boolean;
}

export const DEFAULT_DONATION_PRESETS = [100, 300, 500]; // £1, £3, £5 in pence

export interface SocietyDonationSettings {
    allow_donations: boolean;
}

export interface CheckoutWithDonation {
    ticketPrice: number; // In pence
    quantity: number;
    donationAmount: number; // In pence (0 if no donation)
    totalAmount: number; // ticketPrice * quantity + donationAmount
}

// Standalone Society Donation types
export interface SocietyDonation {
    id: string;
    society_uid: string;
    user_id?: string;
    donor_name?: string;
    donor_email: string;
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
    amount: number; // In pence
    fee_covered: number; // Stripe fee covered by donor (in pence)
    currency: string;
    payment_status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    message?: string;
    created_at: string;
    completed_at?: string;
}

export interface CreateSocietyDonationRequest {
    society_uid: string;
    amount: number; // In pence
    donor_name?: string;
    donor_email: string;
    message?: string;
    cover_fee?: boolean; // Whether donor wants to cover Stripe processing fee
}

// Donation presets for standalone donations (higher than event donations)
export const STANDALONE_DONATION_PRESETS = [500, 1000, 2000]; // £5, £10, £20 in pence

// Stripe fee calculation (approximate: 1.5% + 20p for UK cards)
export const STRIPE_FEE_PERCENTAGE = 1.5;
export const STRIPE_FEE_FIXED_PENCE = 20;

export function calculateStripeFee(amountInPence: number): number {
    return Math.round((amountInPence * STRIPE_FEE_PERCENTAGE / 100) + STRIPE_FEE_FIXED_PENCE);
}

// Featured Events types
export interface FeaturedEvent {
    id: string;
    event_id: string;
    event?: Event;
    custom_description: string | null;
    featured_start: string;
    featured_end: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface FeaturedEventFormData {
    event_id: string;
    custom_description?: string;
    featured_start: string;
    featured_end: string | null;
}

export interface FeaturedEventWithEvent extends FeaturedEvent {
    event: Event;
}
