import { items } from "@/data/grid-data";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid"

export const LandingPageGrid = () => {
    return (
        <div className="py-24 max-w-[1200px] w-full max-[1200px]:px-4">
            <BentoGrid>
                {items.map((item, i) => (
                    <BentoGridItem
                        key={i}
                        icon={item.icon as any}
                        title={item.title}
                        description={item.description}
                        header={item.header}
                        imagePath={item.imagePath}
                        className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                    />
                ))}
            </BentoGrid>
        </div>
    );
}