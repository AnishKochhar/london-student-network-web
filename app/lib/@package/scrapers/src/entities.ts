import * as t from 'zod'

// Lectures
export const Lecture = t.object({
    title: t.string(),
    link: t.string(),
    time_start: t.string(),
    free: t.boolean(),
    summary: t.string().optional(),
    time_end: t.string().optional(),
    link_booking: t.string().optional(),
    summary_html: t.string().optional(),
    location: t.string().optional(),
    image: t.object({ src: t.string() }).optional(),
    cost: t.number().optional(),
    speakers: t.array(t.object({ name: t.string(), bio: t.string().optional() })).optional(),
})

export type Lecture = t.TypeOf<typeof Lecture>

// Competitions
export const Competition = t.object({
    title: t.string(),
    link: t.string(),
    time_start: t.string(),
    free: t.boolean(),

    summary: t.string().optional(),
    time_end: t.string().optional(),
    link_registration: t.string().optional(),
    summary_html: t.string().optional(),
    location: t.string().optional(),
    image: t.object({ src: t.string() }).optional(),
    cost: t.number().optional(),
    organizers: t.array(t.object({ name: t.string(), bio: t.string().optional() })).optional(),
})

export type Competition = t.TypeOf<typeof Competition>

// Sporting Events
export const SportingEvent = t.object({
    title: t.string(),
    link: t.string(),
    time_start: t.string(),
    free: t.boolean(),

    summary: t.string().optional(),
    time_end: t.string().optional(),
    link_tickets: t.string().optional(),
    summary_html: t.string().optional(),
    location: t.string().optional(),
    image: t.object({ src: t.string() }).optional(),
    cost: t.number().optional(),
    teams: t.array(t.object({ name: t.string(), description: t.string().optional() })).optional(),
})

export type SportingEvent = t.TypeOf<typeof SportingEvent>

// Networking Events
export const NetworkingEvent = t.object({
    title: t.string(),
    link: t.string(),
    time_start: t.string(),
    free: t.boolean(),

    summary: t.string().optional(),
    time_end: t.string().optional(),
    link_registration: t.string().optional(),
    summary_html: t.string().optional(),
    location: t.string().optional(),
    image: t.object({ src: t.string() }).optional(),
    cost: t.number().optional(),
    hosts: t.array(t.object({ name: t.string(), bio: t.string().optional() })).optional(),
})

export type NetworkingEvent = t.TypeOf<typeof NetworkingEvent>

// Charity Events
export const CharityEvent = t.object({
    title: t.string(),
    link: t.string(),
    time_start: t.string(),
    free: t.boolean(),

    summary: t.string().optional(),
    time_end: t.string().optional(),
    link_donation: t.string().optional(),
    summary_html: t.string().optional(),
    location: t.string().optional(),
    image: t.object({ src: t.string() }).optional(),
    cost: t.number().optional(),
    organizers: t.array(t.object({ name: t.string(), bio: t.string().optional() })).optional(),
})

export type CharityEvent = t.TypeOf<typeof CharityEvent>

// Hosts
export const Host = t.object({
    name: t.string(),
    icon: t.string().optional(),
    website: t.string(),
    description: t.string().optional(),
    lectures: t.array(Lecture),
    twitter: t.string().optional(),
    threads: t.string().optional(),
    bluesky: t.string().optional(),
})

export type Host = t.TypeOf<typeof Host>
