"use client"

import { Button } from "@/components/ui/button";
import { IconGhost2 } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "../styles/404.css"

export default function NotFound() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="flex items-center justify-center w-full h-screen fade-in">
      <div className="flex flex-wrap items-center justify-center">
        <Image
          className="animate-ghosty opacity-90"
          src="/ghosty.png"
          alt="404"
          width={400}
          height={400}
          priority
          onLoad={handleImageLoad}
        />
        
        {imageLoaded && (
          <div className="flex flex-col gap-4">
            <h1 className="max-[640px]:text-5xl text-7xl font-bold text-white/70 tracking-widest">Are you lost?</h1>
            <p className="max-[640px]:text-lg text-xl text-white/50 tracking-wide">Because there is no page...</p>
            <Button className="flex gap-4 w-fit text-lg px-4"
              variant={"ghost"}
              onClick={() => {
                router.push("/");
              }}>
              <IconGhost2 strokeWidth={1} size={36} />
              Run away
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
