import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { TextEditor } from "@/features/TextEditor"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export const GenerateDescriptionDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { editorContent, setEditorContent } = useGroupDataContext();
    const [mood, setMood] = useState("");
    const [length, setLength] = useState("");
    const [language, setLanguage] = useState("");
    const pathname = usePathname();
    const [currentPath, setCurrentPath] = useState("");

    useEffect(() => {
        setCurrentPath(pathname);
    }, [pathname]);

    const generateRequest = async () => {
        try {
            let apiEndpoint = "";

            if (currentPath.includes("event-page")) {
                apiEndpoint = "/api/generate-event-description";
            } else if (currentPath.includes("group-page")) {
                apiEndpoint = "/api/generate-group-description";
            } else if (currentPath.includes("events")) {
                apiEndpoint = "/api/generate-event-description";
            } else if (currentPath.includes("groups")) {
                apiEndpoint = "/api/generate-group-description";
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editorContent, mood, length, language }),
            });

            if (!response.ok) throw new Error("Generation request failed");

            const data = await response.json();
            setEditorContent(data.eventDescription);
            setIsOpen(false);
        } catch (error) {
            console.error("Error in generateRequest:", error);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                setEditorContent("");
            }}>
                <DialogTrigger asChild>
                    <Button className="flex gap-2 w-fit" variant="ghost">
                        <Sparkles size={20} /> Generate with AI
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex items-center justify-center w-full max-w-[100vw] h-screen rounded-none bg-transparent">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-start gap-4 justify-center text-white/70">
                            <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                                <Sparkles size={32} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-bold">Generate Description</h1>
                                <p className="text-white/50">Generate a description for your {pathname.includes("event-page") ? "event" : "group"} using AI</p>
                            </div>
                        </div>
                        <div className="flex justify-between w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70">Mood</p>
                                <div className="flex">
                                    <Toggle onClick={() => setMood("happy-party")}>🎉</Toggle>
                                    <Toggle onClick={() => setMood("formal-business")}>💼</Toggle>
                                    <Toggle onClick={() => setMood("funny-playful")}>🤣</Toggle>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-white/70">Length</p>
                                <div className="flex">
                                    <Toggle onClick={() => setLength("short")}>S</Toggle>
                                    <Toggle onClick={() => setLength("medium")}>M</Toggle>
                                    <Toggle onClick={() => setLength("long")}>L</Toggle>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 items-end max-w-[400px] w-full">
                            <Input placeholder="Description language..."
                                onChange={(e) => setLanguage(e.target.value)} />
                            <TextEditor {
                                ...{
                                    editorContent: editorContent,
                                    onChange: setEditorContent
                                }
                            } />
                            <HoverBorderGradient onClick={generateRequest}>
                                Generate Description
                            </HoverBorderGradient>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};