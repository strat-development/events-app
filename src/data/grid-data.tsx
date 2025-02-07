import { IconBuildingCarousel, IconRobot, IconTableOptions } from "@tabler/icons-react";
import { ChartArea, Ticket } from "lucide-react";
import { title } from "process";

export const items = [
  {
    title: "Event topics",
    description: "Find events in your area based on your interests",
    header: null,
    icon: <IconBuildingCarousel className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Interest-feature.png"
  },
  {
    title: "Custom group page",
    description: "Fully customizable pages for all of your groups",
    header: null,
    icon: <IconTableOptions  className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Custom-group-page.png"
  },
  {
    title: "Events all around the world",
    description: "Find events in cities all around the world",
    header: null,
    icon: <Ticket className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Events-cities-edited.png"
  },
  {
    title: "Custom event page",
    description: "Customize you event pages to fit your needs",
    header: null,
    icon: <IconTableOptions className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Custom-event-page.png"
  },
  {
    title: "Automatic event search",
    description: "Fint events all around the internet and save to your dashboard",
    header: null,
    icon: <IconRobot className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Automatic-search.png"
  },
  {
    title: "Events statistics",
    description: "Track monthly statistics for your events",
    header: null,
    icon: <ChartArea className="h-6 w-6 text-neutral-500" />,
    imagePath: "/BarLineChart.png"
  }
];