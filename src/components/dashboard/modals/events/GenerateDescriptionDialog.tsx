import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { TextEditor } from "@/features/TextEditor"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { Brain, Sparkles, Wand2 } from "lucide-react"
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");

    useEffect(() => {
        setCurrentPath(pathname);
    }, [pathname]);

    const generateRequest = async () => {
        try {
            setIsGenerating(true);
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
            setGeneratedContent(data.eventDescription);
            
            setTimeout(() => {
                setEditorContent(data.eventDescription);
                setIsGenerating(false);
            }, 500);
        } catch (error) {
            console.error("Error in generateRequest:", error);
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setMood("");
        setLength("");
        setLanguage("");
        setGeneratedContent("");
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                } else {
                    setIsOpen(open);
                }
            }}>
                <DialogTrigger asChild>
                    <Button className="flex gap-2 w-fit bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 px-4 py-2 rounded-xl" variant="ghost">
                        <Sparkles size={18} className="text-purple-400" />
                        <span className="text-sm font-medium">Generate with AI</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="flex items-center justify-center w-full max-w-[100vw] h-screen rounded-none bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 backdrop-blur-xl border-0 overflow-y-auto">
                  
                    <div className="flex flex-col gap-4 max-w-[700px] w-full p-4 my-6 mt-36">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-md opacity-50"></div>
                                <div className="relative p-2.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    AI Description Generator
                                </h1>
                                <p className="text-white/60 text-xs">
                                    Generate a {pathname.includes("event-page") || pathname.includes("events") ? "event" : "group"} description using AI
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
                                <p className="text-white/90 font-semibold mb-2 flex items-center gap-1.5 text-xs">
                                    <span className="text-lg">🎭</span> Mood
                                </p>
                                <div className="flex gap-1.5">
                                    <Toggle 
                                        pressed={mood === "happy-party"}
                                        onClick={() => setMood(mood === "happy-party" ? "" : "happy-party")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="text-xl">🎉</span>
                                    </Toggle>
                                    <Toggle 
                                        pressed={mood === "formal-business"}
                                        onClick={() => setMood(mood === "formal-business" ? "" : "formal-business")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="text-xl">💼</span>
                                    </Toggle>
                                    <Toggle 
                                        pressed={mood === "funny-playful"}
                                        onClick={() => setMood(mood === "funny-playful" ? "" : "funny-playful")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="text-xl">🤣</span>
                                    </Toggle>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
                                <p className="text-white/90 font-semibold mb-2 flex items-center gap-1.5 text-xs">
                                    <span className="text-lg">📏</span> Length
                                </p>
                                <div className="flex gap-1.5">
                                    <Toggle 
                                        pressed={length === "short"}
                                        onClick={() => setLength(length === "short" ? "" : "short")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="font-bold text-sm">S</span>
                                    </Toggle>
                                    <Toggle 
                                        pressed={length === "medium"}
                                        onClick={() => setLength(length === "medium" ? "" : "medium")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="font-bold text-sm">M</span>
                                    </Toggle>
                                    <Toggle 
                                        pressed={length === "long"}
                                        onClick={() => setLength(length === "long" ? "" : "long")}
                                        className="flex-1 data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all h-9"
                                    >
                                        <span className="font-bold text-sm">L</span>
                                    </Toggle>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
                            <p className="text-white/90 font-semibold mb-2 flex items-center gap-1.5 text-xs">
                                <span className="text-lg">🌍</span> Language
                            </p>
                            <Input 
                                placeholder="e.g., English, Spanish, French..."
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full h-9"
                            />
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center min-h-[250px] gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                                        <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full animate-bounce">
                                            <Brain className="w-10 h-10 text-white" strokeWidth={2} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-0.5">
                                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                                            Generating Description...
                                        </h3>
                                        <p className="text-white/50 text-xs">AI is crafting your content</p>
                                    </div>

                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="min-h-[250px]">
                                    <TextEditor
                                        editorContent={editorContent}
                                        onChange={setEditorContent}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 h-9 px-4"
                                disabled={isGenerating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={generateRequest}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 h-9 px-4"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span className="text-sm">{isGenerating ? "Generating..." : "Generate"}</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};