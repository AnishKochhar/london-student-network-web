import EventInfo from "./event-info";

export default function Page() {
    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#feffff]">
            <EventInfo />
        </main>
    );
}
