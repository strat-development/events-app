import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const QRCodeGenerator = () => {
  const qrCodeRef = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: 200,
        height: 200,
        data: window.location.href,
        qrOptions: {
          typeNumber: 6,
          mode: 'Byte',
          errorCorrectionLevel: 'Q'
        },
        dotsOptions: {
          type: "extra-rounded",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: "#CA73FF" },
              { offset: 1, color: "#3FA3FF" },
              { offset: 1, color: "#6FF6FF" },
            ],
          },
        },
        backgroundOptions: {
          color: "rgba(255,255,255,1)",
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: "#CA73FF" },
              { offset: 1, color: "#3FA3FF" },
              { offset: 1, color: "#6FF6FF" },
            ],
          },
        },
        cornersDotOptions: {
          type: "dot",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: "#CA73FF" },
              { offset: 1, color: "#3FA3FF" },
              { offset: 1, color: "#6FF6FF" },
            ],
          },
        },
      });
    }

    if (qrCodeRef.current) {
      qrCode.current.append(qrCodeRef.current);
    }

    return () => {
      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = "";
      }
    };
  }, []);

  const downloadQRCode = (fileType) => {
    qrCode.current.download({ name: "qr-code", extension: fileType });
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center p-8">
      <div className="flex bg-white p-4 rounded-xl">
        <div ref={qrCodeRef}></div>
      </div>

      <Button className="w-full" 
      variant="outline"
        onClick={() => downloadQRCode("png")}>
        Download Code
      </Button>
      <Button className="w-full"
      variant="ghost" 
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);

        toast({
          title: "Link Copied",
          description: "You can now share this link with others",
        });
      }
      }>
        Copy Link
      </Button>
    </div>
  );
};
