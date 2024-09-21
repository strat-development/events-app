import { EventSearchComponent } from "@/features/events-main-page/EventSearchComponent";

export default function Home() {
    return (
        <div className="flex justify-between items-center h-[100vh]">
            <EventSearchComponent city="Gdańsk" />
        </div>
    );
}