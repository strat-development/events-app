// "use client"

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { toast } from "@/components/ui/use-toast";
// import { useUserContext } from "@/providers/UserContextProvider";
// import { useState } from "react";
// import { useMutation } from "react-query";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import { Database } from "@/types/supabase";
// import { Card } from "@/components/ui/card";
// import { Heart } from "lucide-react";
// import { SavedEventsSection } from "@/components/dashboard/modals/event-searcher/SavedEventsSection";
// import { Navbar } from "@/components/dashboard/Navbar";
// import GridLoader from "react-spinners/GridLoader";
// import Link from "next/link";

// interface Event {
//     name: string;
//     city: string;
//     place: string;
//     link: string;
//     date: string;
//     time: string;
// }

// export default function EventSearcher() {
//     const supabase = createClientComponentClient<Database>();
//     const [result, setResults] = useState<Event[] | null>(null);
//     const [inputValue, setInputValue] = useState<string>("");
//     const [eventCity, setEventCity] = useState<string>("");
//     const { userId } = useUserContext();
//     const [eventType, setEventType] = useState<string>("Saved");
//     const eventTypes = [
//         "Saved",
//         "Tickets",
//         "Other"
//     ];
//     const [loading, setLoading] = useState<boolean>(false);
//     const apiPaths: { [key: string]: string } = {
//         "Saved": "",
//         "Tickets": "/api/scrape-tickets",
//         "Other": "/api/scrape-other"
//     }
//     const siteUrls: { [key: string]: string } = {
//         "Saved": "",
//         "Tickets": process.env.NEXT_PUBLIC_TICKETS_SITE_URL || "",
//         "Other": process.env.NEXT_PUBLIC_OTHER_SITE_URL || ""
//     }

//     async function handleOnClick() {
//         setLoading(true);
//         const results = await fetch(apiPaths[eventType], {
//             method: 'POST',
//             body: JSON.stringify({
//                 siteUrl: siteUrls[eventType],
//                 inputValue: inputValue,
//                 city: eventCity || ""
//             })
//         }).then(r => r.json())
//         setResults(results.results);
//         setLoading(false);
//     }

//     const saveEventMutation = useMutation(async (eventData: any) => {
//         const { name, city, place, link, date, time } = eventData;
//         const { data, error } = await supabase
//             .from("saved-events")
//             .upsert({
//                 user_id: userId,
//                 event_name: name,
//                 event_city: city,
//                 event_place: place,
//                 event_link: link,
//                 event_date: date,
//                 event_time: time
//             })

//         if (error) {
//             throw error
//         }
//     },
//         {
//             onSuccess: () => {
//                 toast({
//                     title: "Event saved",
//                     description: "You can now view this event in your saved events",
//                 })
//             },
//             onError: (error) => {
//                 toast({
//                     title: "Error",
//                     description: "There was an error saving this event",
//                 })
//             }
//         });

//     return (
//         <div className="flex justify-between items-start pt-24 max-w-[1200px] w-full justify-self-center">
//             <Navbar />
//             <div className="max-w-[1200px] min-h-screen w-full justify-self-center flex flex-col items-start justify-start gap-4 pl-4 min-[900px]:pl-16">
//                 <div className="flex gap-4">
//                     {eventTypes.map((type, index) => (
//                         <Button className={eventType === type ? "border-b-[1px] border-white/70 text-white/70 rounded-none hover:bg-transparent" : "text-white/50 hover:bg-transparent"}
//                             variant="ghost"
//                             key={index}
//                             onClick={() => {
//                                 setEventType(type)
//                             }}>
//                             {type}
//                         </Button>
//                     ))}
//                 </div>


//                 {eventType === "Saved" && (
//                     <SavedEventsSection />
//                 ) || eventType === "Tickets" && (
//                     <>
//                         <div className="flex gap-4">
//                             <Input
//                                 className="input input-bordered w-fit placeholder:text-white/50 text-white/70"
//                                 type="text"
//                                 placeholder="Enter search term"
//                                 value={inputValue || ''}
//                                 onChange={(e) => setInputValue(e.target.value)}
//                             />
//                             <Button className="text-white/70"
//                                 variant="outline"
//                                 onClick={handleOnClick}>Search</Button>
//                         </div>


//                         {loading && (
//                             <div className="flex flex-col gap-4 justify-center items-center w-full h-[40vh]">
//                                 <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
//                                 <h2 className="text-white/70 text-lg text-bold">Searching for events</h2>
//                             </div>
//                         )}

//                         {!loading && result && (
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                 {result.map((event, index) => (
//                                     <Card key={index} className="shadow-md rounded-lg p-4 relative">
//                                         <h3 className="text-lg font-bold text-white/70 max-w-[90%] truncate">{event.name}</h3>
//                                         <p className="text-sm text-white/50">{event.city}</p>
//                                         <p className="text-sm text-white/50">{event.place}</p>
//                                         <p className="text-sm text-white/50">{event.date}</p>
//                                         <p className="text-sm text-white/50">{event.time}</p>
//                                         <Link href={event.link || ""} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Find Tickets</Link>
//                                         <Heart className="absolute text-red-500 top-4 right-4" onClick={() => saveEventMutation.mutate(event)} />
//                                     </Card>
//                                 ))}
//                             </div>
//                         )}
//                     </>
//                 ) || eventType === "Other" && (
//                     <>
//                         <div className="flex gap-4">
//                             <Input
//                                 className="input input-bordered w-fit placeholder:text-white/50 text-white/70"
//                                 type="text"
//                                 placeholder="Enter search term"
//                                 value={inputValue || ''}
//                                 onChange={(e) => setInputValue(e.target.value)}
//                             />
//                             <Input
//                                 className="input input-bordered w-fit placeholder:text-white/50 text-white/70"
//                                 type="text"
//                                 placeholder="Enter city"
//                                 value={eventCity || ''}
//                                 onChange={(e) => setEventCity(e.target.value)}
//                             />
//                             <Button className="text-white/70"
//                                 variant="outline"
//                                 onClick={handleOnClick}>Search</Button>
//                         </div>


//                         {loading && (
//                             <div className="flex flex-col gap-4 justify-center items-center w-full h-[40vh]">
//                                 <GridLoader className="opacity-50" color="#fff" size={24} margin={2} />
//                                 <h2 className="text-white/70 text-lg text-bold">Searching for events</h2>
//                             </div>
//                         )}

//                         {!loading && result && (
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                 {result.map((event, index) => (
//                                     <Card key={index} className="shadow-md rounded-lg p-4 relative">
//                                         <h3 className="text-lg font-bold text-white/70 max-w-[90%] truncate">{event.name}</h3>
//                                         <p className="text-sm text-white/50">{event.city}</p>
//                                         <p className="text-sm text-white/50">{event.place}</p>
//                                         <p className="text-sm text-white/50">{event.date}</p>
//                                         <p className="text-sm text-white/50">{event.time}</p>
//                                         <Link href={event.link || ""} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Find Tickets</Link>
//                                         <Heart className="absolute text-red-500 top-4 right-4" onClick={() => saveEventMutation.mutate(event)} />
//                                     </Card>
//                                 ))}
//                             </div>
//                         )}
//                     </>
//                 )}

//             </div>
//         </div>
//     );
// }