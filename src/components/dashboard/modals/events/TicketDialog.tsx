import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GlareCard } from "@/components/ui/glare-card";
import { useUserContext } from "@/providers/UserContextProvider";
import { Database } from "@/types/supabase";
import { TicketsData } from "@/types/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconGhost2Filled } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";

interface TicketDialogProps {
    ticketsData: TicketsData[];
    isTicketExpired: boolean;
  }
  
  export const TicketDialog = ({ ticketsData, isTicketExpired }: TicketDialogProps) => {
    const supabase = createClientComponentClient<Database>();
    const [isOpen, setIsOpen] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ publicUrl: string }[]>([]);
    const { userId } = useUserContext();
  
    const { data: images, isLoading } = useQuery(
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
            <Button variant="outline">
              Show Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-full bg-transparent border-none items-center justify-center">
            <GlareCard isTicketExpired={isTicketExpired} className="py-4 max-w-[425px] w-full">
              <div className={`flex items-center flex-col gap-2 w-full ${isTicketExpired ? "opacity-50" : "opacity-100"}`}>
                {imageUrls.length > 0 && imageUrls.some(image => image.publicUrl) ? (
                  imageUrls.map((image, index) =>
                    image.publicUrl ? (
                      <Image
                        key={index}
                        src={image.publicUrl}
                        alt="Profile picture"
                        width={128}
                        height={128}
                        className="rounded-full"
                      />
                    ) : null
                  )
                ) : (
                  <div className="w-fit h-full flex flex-col gap-2 items-center justify-center rounded-xl">
                    <IconGhost2Filled className="w-24 h-24 text-white" strokeWidth={1} />
                    <p className="text-white/70 text-lg">No profile picture</p>
                  </div>
                )}
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col justify-between items-center">
                    <h2 className="text-2xl text-white font-bold tracking-wide truncate">{ticket?.user_fullname}</h2>
                    <span className="text-white/70 truncate">{ticket?.user_email}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-white text-xl font-bold tracking-wide truncate">{ticket?.event_title}</span>
                    <div className="text-white/70 flex gap-2 truncate"><Calendar size={20} />{format(parseISO(ticket?.event_starts_at as string), 'do MMMM yyyy')}</div>
                    <div className="text-white/70 flex gap-2 truncate"><MapPin size={20} />{ticket?.event_address}</div>
                    <div className="text-white/70 flex gap-2">
                      <Ticket size={20} />
                      {ticket?.ticket_price === "FREE" ? (
                        <p className="text-sm text-white/60 font-bold tracking-wide">FREE</p>
                      ) : (
                        <p className="text-sm text-white/60 font-bold tracking-wide">{ticket?.ticket_price}$</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </GlareCard>
          </DialogContent>
        </Dialog>
      </>
    );
  };