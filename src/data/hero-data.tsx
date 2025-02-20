import { IconBuildingCarousel, IconRobot, IconTableOptions } from "@tabler/icons-react";
import { ChartArea, Ticket } from "lucide-react";

interface Action {
  title: string
  description?: string
  image_url?: string
}

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
    description: "Customize your event pages to fit your needs",
    header: null,
    icon: <IconTableOptions className="h-6 w-6 text-neutral-500" />,
    imagePath: "/Custom-event-page.png"
  },
  {
    title: "Automatic event search",
    description: "Find events all around the internet and save to your dashboard",
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

export const actions: Action[] = [
  {
      title: 'Payments',
      description: 'There are no payments. Just enjoy the project, have fun and share positive experiences',
      image_url: '/payments.png'
  },
  {
      title: 'Project idea',
      description: 'The project idea is to create a space where people can share their experiences, learn from each other and improve',
      image_url: '/chat-icon.png'
  },
  {
      title: 'Location',
      description: 'We are basically everywhere, you can join us from any part of the world. Create events wherever you are',
      image_url: '/location.png'
  }
]
