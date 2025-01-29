import { cn } from "@/lib/utils";
import Image from "next/image";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[1200px] mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    imagePath
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ElementType
    imagePath?: string;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 relative overflow-hidden rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-none border-white/[0.1] border justify-between flex flex-col space-y-4",
                className
            )}>
            {header}
            <div className="max-h-[296px] p-4">
                <Image objectFit="cover"
                    src={imagePath || ""} alt="" width={2000} height={2000} />
            </div>
            <div className="group-hover/bento:translate-x-2 p-4 transition duration-200 w-full backdrop-blur-md">
                {icon as any}
                <div className="font-sans font-bold text-2xl text-white/70 mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-white/50">
                    {description}
                </div>
            </div>
            <div
                className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-[.04] [mask-image:radial-gradient(#fff,transparent,75%)]"
                style={{
                    backgroundImage: "url(https://assets.aceternity.com/noise.webp)",
                    backgroundSize: "30%",
                }}
            ></div>
        </div>
    );
};