export interface DefaultEmailPayloadType {
    to: string;
    from?: string; // there is a default sender 'hello@londonstudentnetwork.com'
    replyTo?: string; // optional reply-to address
    subject: string;
    text?: string; // email might only contain html body
    html?: string; // email might only contain text body
}

export interface FallbackEmailServiceResponse {
    success: boolean;
    error?: string; // when there is an error
    info?: string; // when the response is succesfull, gives email transportation info
}
