import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GlareCard } from "@/components/ui/glare-card";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { TicketsData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconGhost2Filled } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Ticket, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { twMerge } from "tailwind-merge";

interface TicketDialogProps {
    ticketsData: TicketsData[];
    isTicketExpired: boolean;
  }
  
  export const TicketDialog = ({ ticketsData, isTicketExpired }: TicketDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const { userId } = useUserContext();
  
    const { data: images } = useQuery(
      ['profile-pictures', userId],
      async () => {
        const { data, error } = await supabase
          .from('profile-pictures')
          .select('*')
          .eq('user_id', userId);
        if (error) {
          throw error;
        }
        return data || [];
      },
      {
        enabled: !!userId,
        cacheTime: 10 * 60 * 1000,
      }
    );
  
    useEffect(() => {
      if (images) {
        Promise.all(
          images
            .filter(image => image.image_url.trim() !== "")
            .map(async (image) => {
              const { data: publicURL } = await supabase.storage
                .from('profile-pictures')
                .getPublicUrl(image.image_url);
              return { publicUrl: publicURL.publicUrl };
            })
        )
          .then((publicUrls) => setImageUrls(publicUrls))
          .catch(console.error);
      }
    }, [images]);
  
    const ticket = ticketsData[0];
  
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className={twMerge(
                "w-full mt-2 transition-all duration-300",
                isTicketExpired 
                  ? "bg-slate-700/50 hover:bg-slate-700/70 border-slate-600/50 text-white/60" 
                  : "bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold"
              )}
              variant="outline"
            >
              {isTicketExpired ? "View Expired Ticket" : "View Ticket"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] w-full bg-transparent border-none items-center justify-center p-0">
            <GlareCard 
              isTicketExpired={isTicketExpired} 
              className={twMerge(
                "!w-full !max-w-full py-8 px-8 relative overflow-y-auto",
                isTicketExpired && "opacity-70"
              )}
            >
              <div className="absolute top-4 right-4 z-50">
                {isTicketExpired ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-full">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-xs font-semibold text-red-300 tracking-wide">EXPIRED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-xs font-semibold text-white/90 tracking-wide">VALID</span>
                  </div>
                )}
              </div>

              <div className="relative flex items-center flex-col gap-6 w-full z-10">
                <div className="relative">
                  {imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) ? (
                    imageUrls.map((image, index) =>
                      image.publicUrl ? (
                        <div key={index} className="relative">
                          <div className={twMerge(
                            "relative rounded-full p-1",
                            isTicketExpired 
                              ? "bg-gradient-to-br from-slate-600 to-slate-700" 
                              : "bg-gradient-to-br from-white/30 to-white/10"
                          )}>
                            <Image
                              src={image.publicUrl}
                              alt="Profile picture"
                              width={128}
                              height={128}
                              className={twMerge(
                                "rounded-full aspect-square object-cover border-4 border-slate-900",
                                isTicketExpired && "grayscale"
                              )}
                            />
                          </div>
                        </div>
                      ) : null
                    )
                  ) : (
                    <div className="relative">
                      <div className={twMerge(
                        "relative w-32 h-32 flex flex-col gap-2 items-center justify-center rounded-full p-1",
                        isTicketExpired 
                          ? "bg-gradient-to-br from-slate-600 to-slate-700" 
                          : "bg-gradient-to-br from-white/30 to-white/10"
                      )}>
                        <div className="w-full h-full flex flex-col gap-1 items-center justify-center rounded-full bg-slate-900">
                          <IconGhost2Filled className="w-12 h-12 text-white/70" strokeWidth={1} />
                          <p className="text-white/50 text-xs">No photo</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-center text-center w-full px-4">
                  <h2 className={twMerge(
                    "text-2xl font-bold tracking-wide truncate max-w-full",
                    isTicketExpired ? "text-white/70" : "text-white"
                  )}>
                    {ticket?.user_fullname}
                  </h2>
                  <span className="text-white/60 text-sm truncate max-w-full">{ticket?.user_email}</span>
                </div>

                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="flex flex-col gap-4 w-full px-4">
                  <div className="flex items-center gap-3">
                    <div className={twMerge(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      isTicketExpired 
                        ? "bg-slate-600/30 border border-slate-500/30" 
                        : "bg-white/10 border border-white/20"
                    )}>
                      <Sparkles className={twMerge(
                        "w-5 h-5",
                        isTicketExpired ? "text-slate-400" : "text-white/80"
                      )} />
                    </div>
                    <span className={twMerge(
                      "text-lg font-bold tracking-wide truncate",
                      isTicketExpired ? "text-white/60" : "text-white"
                    )}>
                      {ticket?.event_title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={twMerge(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      isTicketExpired 
                        ? "bg-slate-600/30 border border-slate-500/30" 
                        : "bg-white/10 border border-white/20"
                    )}>
                      <Calendar className={twMerge(
                        "w-5 h-5",
                        isTicketExpired ? "text-slate-400" : "text-white/80"
                      )} />
                    </div>
                    <span className={twMerge(
                      "text-sm font-medium",
                      isTicketExpired ? "text-white/50" : "text-white/80"
                    )}>
                      {format(parseISO(ticket?.event_starts_at as string), 'EEEE, MMMM do yyyy')}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={twMerge(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      isTicketExpired 
                        ? "bg-slate-600/30 border border-slate-500/30" 
                        : "bg-white/10 border border-white/20"
                    )}>
                      <MapPin className={twMerge(
                        "w-5 h-5",
                        isTicketExpired ? "text-slate-400" : "text-white/80"
                      )} />
                    </div>
                    <span className={twMerge(
                      "text-sm font-medium line-clamp-2 pt-2",
                      isTicketExpired ? "text-white/50" : "text-white/80"
                    )}>
                      {ticket?.event_address}
                    </span>
                  </div>
                      
                  <div className="flex items-center gap-3">
                    <div className={twMerge(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      isTicketExpired 
                        ? "bg-slate-600/30 border border-slate-500/30" 
                        : "bg-white/10 border border-white/20"
                    )}>
                      <Ticket className={twMerge(
                        "w-5 h-5",
                        isTicketExpired ? "text-slate-400" : "text-white/80"
                      )} />
                    </div>
                    {ticket?.ticket_price === "FREE" ? (
                      <span className={twMerge(
                        "text-xl font-bold tracking-wider",
                        isTicketExpired ? "text-white/50" : "text-white"
                      )}>
                        FREE
                      </span>
                    ) : (
                      <span className={twMerge(
                        "text-xl font-bold tracking-wider",
                        isTicketExpired ? "text-white/50" : "text-white"
                      )}>
                        ${ticket?.ticket_price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlareCard>
          </DialogContent>
        </Dialog>
      </>
    );
  };