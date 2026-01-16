"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Download, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";

interface ImageLightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export const ImageLightbox = ({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setImageError(false);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                setImageError(false);
            } else if (e.key === 'ArrowRight') {
                setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                setImageError(false);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, images.length, onClose]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setImageError(false);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setImageError(false);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(images[currentIndex]);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image-${currentIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5 text-white" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-20 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all"
                        onClick={handleDownload}
                    >
                        <Download className="h-5 w-5 text-white" />
                    </Button>

                    <div className="absolute top-4 left-4 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                        <span className="text-sm font-medium text-white">
                            {currentIndex + 1} / {images.length}
                        </span>
                    </div>

                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {imageError ? (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <ImageOff className="w-16 h-16 text-white/30" strokeWidth={1.5} />
                                <span className="text-white/50">Failed to load image</span>
                            </div>
                        ) : (
                            <Image
                                src={images[currentIndex]}
                                alt={`Image ${currentIndex + 1}`}
                                fill
                                className="object-contain"
                                onError={() => setImageError(true)}
                                priority
                            />
                        )}
                    </div>

                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all"
                                onClick={handlePrevious}
                            >
                                <ChevronLeft className="h-6 w-6 text-white" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/60 hover:border-white/40 transition-all"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-6 w-6 text-white" />
                            </Button>
                        </>
                    )}
        
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] overflow-x-auto">
                            <div className="flex gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentIndex(index);
                                            setImageError(false);
                                        }}
                                        className={twMerge(
                                            "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                                            currentIndex === index
                                                ? "border-white scale-110"
                                                : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60"
                                        )}
                                    >
                                        <Image
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
