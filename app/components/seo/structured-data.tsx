interface OrganizationStructuredDataProps {
    name: string;
    description: string;
    url: string;
    logo?: string;
    sameAs?: string[];
    contactPoint?: {
        contactType: string;
        email: string;
    };
}

interface EventStructuredDataProps {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
        name: string;
        address?: string;
    };
    organizer: {
        name: string;
        url?: string;
    };
    url: string;
    image?: string;
    offers?: {
        price?: string;
        priceCurrency?: string;
        availability?: string;
        url?: string;
    };
}

interface WebsiteStructuredDataProps {
    name: string;
    description: string;
    url: string;
    potentialAction?: {
        target: string;
        queryInput: string;
    };
}

export function OrganizationStructuredData({
    name,
    description,
    url,
    logo,
    sameAs,
    contactPoint,
}: OrganizationStructuredDataProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name,
        description,
        url,
        ...(logo && { logo }),
        ...(sameAs && { sameAs }),
        ...(contactPoint && { contactPoint }),
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'London',
            addressCountry: 'UK',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

export function EventStructuredData({
    name,
    description,
    startDate,
    endDate,
    location,
    organizer,
    url,
    image,
    offers,
}: EventStructuredDataProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name,
        description,
        startDate,
        ...(endDate && { endDate }),
        location: {
            '@type': 'Place',
            name: location.name,
            ...(location.address && {
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: location.address,
                    addressLocality: 'London',
                    addressCountry: 'UK',
                },
            }),
        },
        organizer: {
            '@type': 'Organization',
            name: organizer.name,
            ...(organizer.url && { url: organizer.url }),
        },
        url,
        ...(image && { image }),
        ...(offers && {
            offers: {
                '@type': 'Offer',
                price: offers.price || '0',
                priceCurrency: offers.priceCurrency || 'GBP',
                availability: offers.availability || 'https://schema.org/InStock',
                ...(offers.url && { url: offers.url }),
            },
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

export function WebsiteStructuredData({
    name,
    description,
    url,
    potentialAction,
}: WebsiteStructuredDataProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name,
        description,
        url,
        ...(potentialAction && {
            potentialAction: {
                '@type': 'SearchAction',
                target: potentialAction.target,
                'query-input': potentialAction.queryInput,
            },
        }),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

export function FAQStructuredData({
    questions
}: {
    questions: Array<{ question: string; answer: string }>
}) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((qa) => ({
            '@type': 'Question',
            name: qa.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: qa.answer,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}