import React from "react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-10 py-20">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white">
                    Privacy Policy
                </h1>
                <p className="mt-4 text-sm text-gray-400">
                    Effective Date: 04/11/25
                </p>

                {/* Introduction */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        1. Introduction
                    </h2>
                    <p className="mt-4">
                        This Privacy Policy explains how London Student Network Ltd (&quot;LSN&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, shares, and protects your personal data when you use our platform and attend our events.
                    </p>
                    <p className="mt-4">
                        If you have any questions or concerns about how we handle your data, please contact us at{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>
                        . Data protection matters will be escalated internally to our privacy lead (CEO, Josh Robinson) as needed - please subject your email as DATA ISSUE.
                    </p>
                </section>

                {/* What Data We Collect */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        2. What Data We Collect
                    </h2>
                    <p className="mt-4">
                        We collect the following categories of information:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>
                            <strong>Account & Ticketing Information:</strong> name, email, university, course, event interests, ticket purchases, and internal/external university status.
                        </li>
                        <li>
                            <strong>Usage Data:</strong> privacy-preserving, cookie-free platform analytics on page visits and use.
                        </li>
                        <li>
                            <strong>Special Event Data (occasional):</strong> For certain events (e.g. speed dating), we may collect relationship preferences. This constitutes special category data, is processed only with your explicit consent under Article 9(2)(a) of UK GDPR, and can be withdrawn before or after the event. This data is automatically deleted within seven days, and a record of the consent is retained for up to 30 days for audit purposes, unless you withdraw it sooner.
                        </li>
                        <li>
                            <strong>Photography & Media:</strong> Photos and videos may be taken at events for promotional purposes. You will always be informed beforehand and may opt out (see section 7).
                        </li>
                    </ul>
                    <p className="mt-4">
                        We do not collect phone numbers, dietary information, or financial details beyond those needed for legally-required transactions.
                    </p>
                    <p className="mt-4">
                        We may use your event interests to recommend relevant events; you can change or delete these anytime in your account.
                    </p>
                </section>

                {/* How We Use Your Data */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        3. How We Use Your Data
                    </h2>
                    <p className="mt-4">
                        We process your data for the following purposes, under the lawful bases set out in UK GDPR:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>
                            <strong>Contract (Art. 6(1)(b)):</strong> To register you for events, issue tickets, manage your account, and send essential pre‑event communications or updates.
                        </li>
                        <li>
                            <strong>Legitimate Interests (Art. 6(1)(f)):</strong> To maintain safe and efficient operations, provide attendee lists to reception, analyse platform use, support event logistics, and promote events via general photos and videos. We have carried out Legitimate Interest Assessments to ensure necessity and a fair balance with your privacy rights. You have the right to object at any time and we will respect your request.
                        </li>
                        <li>
                            <strong>Consent (Art. 6(1)(a)):</strong> For email marketing, close-up or featured event media, processing special category data for events, and optional communications such as newsletters. All marketing checkboxes are unticked by default, and you may withdraw consent at any time.
                        </li>
                        <li>
                            <strong>Legal Obligation (Art. 6(1)(c)):</strong> To comply with legal duties including tax, finance, and student safety.
                        </li>
                    </ul>
                    <p className="mt-4">
                        Where more than one lawful basis could apply, we will always rely on the most appropriate basis in context.
                    </p>
                </section>

                {/* Sharing Your Data */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        4. Sharing Your Data
                    </h2>
                    <p className="mt-4">
                        <strong>With Students&apos; Unions & Venues:</strong> We share only essential details (event, name, ticket reference, internal/external status) for event admission and safety.
                    </p>
                    <p className="mt-4">
                        If you choose not to share this information, the venue may not be able to verify your ticket on arrival.
                    </p>
                    <p className="mt-4">
                        We require hosting partners to delete admission lists within 14 days of the event unless required for safety or incident reporting. Until formal Data Sharing Agreements (DSAs) are signed, sharing is carried out under documented interim terms ensuring confidentiality, necessity, and secure transfer.
                    </p>
                    <p className="mt-4">
                        <strong>With Service Providers:</strong> We use trusted providers in the UK and EEA (including AWS Frankfurt and Neon DB, subject to UK adequacy decisions). Where third-party processors are used, they act strictly under our instructions, contractually bound to safeguard your data. Vercel acts as our analytics processor for aggregated usage data only.
                    </p>
                    <p className="mt-4">
                        <strong>International Transfers:</strong> If third-party tools outside the UK/EEA are engaged, transfers rely on the UK-US Data Bridge or UK International Data Transfer Addendum.
                    </p>
                    <p className="mt-4">
                        <strong>No Sale of Data:</strong> We never sell or rent your personal data.
                    </p>
                </section>

                {/* Retention */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        5. Retention
                    </h2>
                    <p className="mt-4">
                        We keep personal data only as long as necessary, in line with a live retention matrix:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>Inactive accounts: deleted after 24 months.</li>
                        <li>Event interest preferences: deleted after 12 months of inactivity.</li>
                        <li>Marketing consent records: reviewed every 24 months.</li>
                        <li>Financial records (when generated): kept for 6 years (HMRC compliance).</li>
                        <li>Special event data: deleted within 7 days of the event; consent records held for up to 30 days.</li>
                        <li>Promotional photos and videos: kept for up to 3 years, then archived or deleted.</li>
                    </ul>
                    <p className="mt-4">
                        All retention periods are actively reviewed; data is securely erased or anonymised once no longer required except where the law requires otherwise.
                    </p>
                </section>

                {/* Marketing */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        6. Marketing
                    </h2>
                    <p className="mt-4">
                        We only send marketing if you explicitly opt in.
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>All boxes are unticked by default.</li>
                        <li>You can withdraw consent or unsubscribe at any time.</li>
                        <li>We maintain a suppression list on a legitimate interests basis to ensure you are not contacted again if you unsubscribe, retained indefinitely until you reverse your opt-out.</li>
                    </ul>
                    <p className="mt-4">
                        For &quot;similar events&quot; you have attended or purchased, we rely on the soft opt-in exception (PECR Regulation 22). Every email provides an easy opt-out.
                    </p>
                </section>

                {/* Photography & Media */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        7. Photography & Media
                    </h2>
                    <p className="mt-4">
                        At events:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>
                            We may take general crowd photos or videos for promotional use. These rely on legitimate interests where individuals are not specifically identified.
                        </li>
                        <li>
                            You will always be notified in pre-event communications and by signage at the event.
                        </li>
                        <li>
                            Anyone preferring not to be photographed may request a &quot;no-photo&quot; indicator at the event.
                        </li>
                        <li>
                            For close-up or featured media, your specific consent is always sought prior to use.
                        </li>
                        <li>
                            All media is stored securely and reviewed before reuse or publication.
                        </li>
                    </ul>
                </section>

                {/* Your Rights */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        8. Your Rights
                    </h2>
                    <p className="mt-4">
                        You have the right to:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>Access your data</li>
                        <li>Request correction</li>
                        <li>Request deletion</li>
                        <li>Request restriction of processing (e.g., while accuracy concerns are investigated)</li>
                        <li>Object to processing (including marketing and photography)</li>
                        <li>Request data portability</li>
                    </ul>
                    <p className="mt-4">
                        You can exercise these rights by contacting{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>.
                    </p>
                    <p className="mt-4">
                        We will respond within one month wherever possible.
                    </p>
                    <p className="mt-4">
                        You also have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO):{" "}
                        <a
                            href="https://www.ico.org.uk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline"
                        >
                            www.ico.org.uk
                        </a>.
                    </p>
                    <p className="mt-4">
                        Rights are provided under UK GDPR and the Data Protection Act 2018.
                    </p>
                </section>

                {/* Security */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        9. Security
                    </h2>
                    <p className="mt-4">
                        We protect your data with industry-standard measures, including:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>Encryption in transit and at rest</li>
                        <li>Multi-factor authentication (MFA)</li>
                        <li>Role-based, least-privilege access</li>
                        <li>Regular reviews of access and audit logs</li>
                    </ul>
                    <p className="mt-4">
                        Systems and controls are tested regularly, and we maintain a documented breach response plan.
                    </p>
                </section>

                {/* Breaches */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        10. Breaches
                    </h2>
                    <p className="mt-4">
                        If we ever suffer a data breach likely to result in a risk to your rights and freedoms, we will:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>Notify the UK Information Commissioner&apos;s Office within 72 hours, unless risk is unlikely</li>
                        <li>Notify you promptly via the email address linked to your account, including guidance on steps to protect yourself</li>
                    </ul>
                </section>

                {/* Updates to This Policy */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        11. Updates to This Policy
                    </h2>
                    <p className="mt-4">
                        We may update this policy from time to time. The latest version will always be available on our website.
                    </p>
                    <p className="mt-4">
                        If we make significant changes, we will notify you by email and/or in-platform message. Previous versions are available on request for transparency.
                    </p>
                </section>

                {/* Company Information */}
                <section className="mt-8">
                    <h2 className="text-xl font-semibold text-white">
                        12. Company Information
                    </h2>
                    <p className="mt-4">
                        <strong>Company Name:</strong> London Student Network Ltd<br />
                        <strong>Company Registration Number:</strong> 15849720<br />
                        <strong>Registered Office Address:</strong> 87 Egginton Road, Etwall, Derby, DE65 6NP<br />
                        <strong>ICO Registration Number:</strong> ZB808699
                    </p>
                    <p className="mt-4">
                        For all privacy-related enquiries, please contact:{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>
                    </p>
                </section>

                {/* Cookies & Analytics Policy */}
                <section className="mt-12 pt-8 border-t border-gray-700">
                    <h1 className="text-3xl font-bold text-white">
                        Cookies & Analytics Policy
                    </h1>
                    <p className="mt-4 text-sm text-gray-400">
                        Effective date: 04/11/25 - Last updated: 04/11/25
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        1) Who we are and what this covers
                    </h2>
                    <p className="mt-4">
                        This policy explains how London Student Network Ltd (&quot;LSN&quot;, &quot;we&quot;, &quot;us&quot;) uses cookies and similar technologies when you use our website and web application (together, the &quot;Services&quot;).
                    </p>
                    <p className="mt-4">
                        Read this alongside our Privacy Policy above for full details on how we handle personal data and our company information.
                    </p>
                    <p className="mt-4">
                        For questions about cookies or analytics, contact:{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        2) Our approach to cookies and storage technologies
                    </h2>
                    <p className="mt-4">
                        We are committed to providing a privacy-preserving service and to minimising tracking.
                    </p>
                    <p className="mt-4">
                        At present, our Services operate without any cookies or local storage identifiers placed on your device. In other words:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>No advertising, tracking, or personalisation cookies</li>
                        <li>No device fingerprinting</li>
                        <li>No localStorage, sessionStorage, IndexedDB or similar persistent technologies</li>
                        <li>No third-party tracking or cross-site scripts</li>
                    </ul>
                    <p className="mt-4">
                        We do not knowingly set or control any cookies or local storage through our own code.
                    </p>
                    <p className="mt-4">
                        If any strictly necessary technologies (for example, a login session cookie) are ever introduced, we will update this policy to explain their essential function before they are deployed.
                    </p>
                    <p className="mt-4">
                        If we later intend to use any non-essential technologies, we will first seek your consent through a clear, compliant banner that offers &quot;Accept&quot; and &quot;Reject&quot; options.
                    </p>
                    <p className="mt-4">
                        <strong>In short:</strong> we do not track you or place anything on your device to identify you.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        3) Analytics (cookie‑free)
                    </h2>
                    <p className="mt-4">
                        We use Vercel Analytics to understand how our site is used — for example, which pages are most visited — so we can keep the platform secure and improve performance.
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>The analytics are cookie‑free and based on aggregated, non‑identifiable technical logs.</li>
                        <li>No personal data or persistent identifiers are collected.</li>
                        <li>Data is processed under our instructions by Vercel, acting as our data processor.</li>
                        <li>Where analytics data may be processed outside the UK, this occurs under safeguards such as the UK International Data Transfer Agreement (IDTA) or Standard Contractual Clauses.</li>
                    </ul>
                    <p className="mt-4">
                        <strong>Legal basis:</strong> our legitimate interests in running and improving a secure, reliable service.
                    </p>
                    <p className="mt-4">
                        You can object to this limited processing at any time by contacting{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        4) Third‑party content, links, and embeds
                    </h2>
                    <p className="mt-4">
                        Our Services may occasionally link to or embed third‑party content such as social media posts, videos, or university event widgets.
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>We do not embed any third‑party scripts by default.</li>
                        <li>When you interact with embedded content (e.g., a YouTube player), the third‑party provider may set cookies or similar technologies that we do not control.</li>
                        <li>Please review the relevant provider&apos;s cookie or privacy notice before using those features.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        5) Your choices and controls
                    </h2>
                    <p className="mt-4">
                        Because we do not currently use cookies or similar storage, no action is required from you.
                    </p>
                    <p className="mt-4">
                        If this ever changes, you will always be able to:
                    </p>
                    <ul className="list-disc ml-8 mt-4">
                        <li>Accept or reject optional cookies using our consent banner, and</li>
                        <li>Withdraw your consent at any time.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        6) Policy updates
                    </h2>
                    <p className="mt-4">
                        We may update this policy from time to time, for example if we introduce login sessions or new analytics tools.
                    </p>
                    <p className="mt-4">
                        When we make important changes, we will clearly post an updated notice on our website or app before the change takes effect.
                    </p>
                    <p className="mt-4">
                        The &quot;Last updated&quot; date above will always reflect the latest version.
                    </p>

                    <h2 className="text-xl font-semibold text-white mt-8">
                        7) Contact us
                    </h2>
                    <p className="mt-4">
                        Questions about this policy or how we measure usage?
                    </p>
                    <p className="mt-4">
                        Email:{" "}
                        <a
                            href="mailto:hello@londonstudentnetwork.com"
                            className="text-blue-400 underline"
                        >
                            hello@londonstudentnetwork.com
                        </a>
                    </p>

                    {/* Cookie Banner Notice */}
                    {/* <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-white">
                            Cookie Banner (notice‑only)
                        </h3>
                        <p className="mt-4 text-gray-300">
                            <strong>Banner text:</strong>
                        </p>
                        <p className="mt-2 italic text-gray-400">
                            "Good news — we don't use cookies. We rely on privacy‑preserving, cookie‑free analytics to keep improving the site. [Learn more] [Close]"
                        </p>
                        <ul className="list-disc ml-8 mt-4 text-sm text-gray-400">
                            <li>Learn more → links to this Cookies & Analytics Policy.</li>
                            <li>Close → simply hides the banner (no cookies or identifiers are set).</li>
                            <li>The banner appears once per session or on first load and can be reopened via a footer link.</li>
                        </ul>
                    </div> */}
                </section>
            </div>
        </div>
    );
}
