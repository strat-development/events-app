import QRCodeStyling from "qr-code-styling";

export const createQrCode = (data: string) => {
  return new QRCodeStyling({
    width: 200,
    height: 200,
    data,
    qrOptions: {
      errorCorrectionLevel: "Q",
    },
    dotsOptions: {
      type: "rounded",
      gradient: {
        type: "linear",
        colorStops: [
          { offset: 0, color: "#CA73FF" },
          { offset: 1, color: "#3FA3FF" },
        ],
      },
    },
    backgroundOptions: {
      color: "rgba(255,255,255,1)",
    },
    cornersSquareOptions: {
      type: "extra-rounded",
    },
    cornersDotOptions: {
      type: "dot",
    },
  });
};
