import Image from "next/image"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"

interface Action {
    title: string
    description?: string
    image_url?: string
}

export const AboutSection = () => {
    const actions: Action[] = [
        {
            title: 'Payments',
            description: 'There are no payments so just enjoy the project, have fun and share positive expeiernces',
            image_url: '/payments.png'
        },
        {
            title: 'Project idea',
            description: 'The project idea is to create a space where people can share their experiences, learn from each other and improve',
            image_url: '/chat-icon.png'
        },
        {
            title: 'Location',
            description: 'We are basically everywhere, so you can join us from any part of the world. Create events wherever you are',
            image_url: '/location.png'
        }
    ]

    function classNames(...classes: (string | boolean)[]): string {
        return classes.filter(Boolean).join(' ')
    }

    return (
        <>
            <div className="max-w-[1200px] w-full px-4 mb-24 flex flex-col items-center justify-center gap-8 max-[900px]:mb-48 min-[768px]:h-screen">
                <div className="flex justify-evenly items-center max-w-[1200px] w-full flex-wrap gap-4">
                    {actions.map((action) => (
                        <Card className="max-w-[360px] relative border-none bg-transparent cursor-pointer hover:bg-white/3 hover:ring-2 hover:ring-white/10 rounded-lg transition-all duration-300">
                            <CardContent key={action.title}
                                className={classNames(
                                    'group relative flex flex-col gap-4 p-6',
                                )}>
                                {action.image_url && <Image src={action.image_url} alt="" width={2000} height={2000} className="aspect-square" />}

                                <CardTitle className="flex flex-col gap-2 text-white/70">
                                    {action.title}
                                </CardTitle>
                                <CardDescription className="text-sm text-white/50 hover:pl-2 transition-all duration-300">
                                    {action.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    )
}