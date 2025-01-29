import { useEffect, useRef } from "react";
import { createQrCode } from "./qrConfig";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function QRCodeGenerator() {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<any>(null);

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = createQrCode(window.location.href);
    }

    if (qrCodeRef.current) {
      qrCode.current.append(qrCodeRef.current);
    }

    return () => {
      qrCode.current = null;
      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = "";
      }
    };
  }, []);

  const downloadQRCode = (fileType: "png" | "jpeg" | "webp" | "svg"): void => {
    if (qrCode.current) {
      qrCode.current.download({ name: "qr-code", extension: fileType });
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center p-8">
      <div className="flex bg-white p-4 rounded-xl">
        <div ref={qrCodeRef}></div>
      </div>

      <Button className="w-full" variant="outline" onClick={() => downloadQRCode("png")}>
        Download Code
      </Button>
      <Button
        className="w-full"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);

          toast({
            title: "Link Copied",
            description: "You can now share this link with others",
          });
        }}
      >
        Copy Link
      </Button>
    </div>
  );
}
