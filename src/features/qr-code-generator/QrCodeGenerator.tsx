import { useEffect, useRef } from "react";
import { createQrCode } from "./qrConfig";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Download, Link2, QrCode } from "lucide-react";

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
      toast({
        title: "QR Code Downloaded",
        description: `Your QR code has been saved as ${fileType.toUpperCase()}`,
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-2xl">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Share This Page
          </h2>
          <p className="text-sm text-white/60">Scan or download the QR code</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-sm opacity-50"></div>
          <div className="relative bg-white p-6 rounded-2xl shadow-xl">
            <div ref={qrCodeRef}></div>
          </div>
        </div>
    
        <div className="flex flex-col gap-3 w-full">
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2" 
            onClick={() => downloadQRCode("png")}
          >
            <Download size={18} />
            Download QR Code
          </Button>
          <Button
            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);

              toast({
                title: "Link Copied!",
                description: "You can now share this link with others",
              });
            }}
          >
            <Link2 size={18} />
            Copy Link
          </Button>
        </div>
      </div>
    </>
  );
}
