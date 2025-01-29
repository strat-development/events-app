import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getChangelog } from "@/fetchers/changeLog/getChangeLog"
import Image from "next/image"
import "../../styles/changelog.css"

export default async function ChangeLogPage() {
    const changeLogData = await getChangelog()

    return (
        <div className="flex flex-col items-center max-w-[1200px] w-full justify-self-center mt-36 min-h-screen relative gap-32">
            <div className="flex flex-col gap-4 text-center">
                <h1 className="text-4xl min-[768px]:text-5xl text-white/70 font-bold tracking-wider">Change Log</h1>
                <p className="min-[768px]:text-lg text-white/50">Updates and improvements to Huddle.</p>
            </div>

            {changeLogData.changeLogPosts.map((post, index) => (
                <div key={index}
                className="flex flex-col min-[768px]:flex-row min-[768px]:justify-center relative gap-8 border-t border-white/10 pt-4">
                    <div className="justify-self-start">
                        <p className="sticky justify-self-start top-24 text-white/50 text-sm">{post.logCreatedAt}</p>
                    </div>

                    <div className="flex flex-col gap-4 min-[768px]:w-[70%]">
                        <h2 className="text-xl font-semibold tracking-wider">{post.logTitle}</h2>
                        <Image className="rounded-md"
                            src={post.logImage?.url || ""} alt={post.logTitle || ""} width={2000} height={2000} />
                        <div className="text-content"
                            dangerouslySetInnerHTML={{ __html: post.changeLogDescription?.html as any }} />
                        <div className="flex flex-col w-full">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem className="border-white/10"
                                    value="item-1">
                                    <AccordionTrigger>Improvements</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-content"
                                            dangerouslySetInnerHTML={{ __html: post.changeLogImprovement?.html as any }} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem className="border-white/10"
                                    value="item-2">
                                    <AccordionTrigger>Fixes</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="text-content"
                                            dangerouslySetInnerHTML={{ __html: post.changeLogFix?.html as any }} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}