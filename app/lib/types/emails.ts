
export interface DefaultEmailPayloadType {
    to: string;
    from?: string; // there is a default sender 'hello@londonstudentnetwork.com'
    subject: string;
    text?: string; // email might only contain html body
    html?: string; // email might only contain text body
}