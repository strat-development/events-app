import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { Brain, Sparkles } from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"
import { imageStyles } from "@/consts/consts"
import { TextEditor } from "@/features/TextEditor"
import { toast } from "@/components/ui/use-toast"

interface Interest {
    name: string
}

export const GenerateEventImageDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [style, setStyle] = useState("");
    const pathname = usePathname();
    const [currentPath, setCurrentPath] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageURLs, setImageURLs] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { interestsData,
        selectedGroup,
        selectedInterests,
        setSelectedInterests,
        setSelectedGroup
    } = useGroupDataContext();
    const [displayedInterests, setDisplayedInterests] = useState<Interest[]>([]);
    const { editorContent, setEditorContent } = useGroupDataContext();
    const [numImages, setNumImages] = useState(4);

    const handleInterestClick = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter((selectedInterest) => selectedInterest !== interest))
        } else {
            setSelectedInterests([...selectedInterests, interest])
        }
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const shuffleInterests = () => {
        if (!interestsData) return;

        const allInterests = interestsData["interest-groups"]
            .filter((group) => selectedGroup === "all" || group["group-name"] === selectedGroup)
            .flatMap((group) => group.interests)
            .filter((interest) => !selectedInterests.includes(interest.name))
            .filter((interest) => interest.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const shuffledInterests = allInterests.sort(() => 0.5 - Math.random()).slice(0, 20);
        setDisplayedInterests(shuffledInterests);
    };

    useEffect(() => {
        shuffleInterests();
    }, [interestsData, selectedGroup, searchQuery]);

    useEffect(() => {
        setCurrentPath(pathname);
    }, [pathname]);

    const generateRequest = async () => {
        try {
            setIsGenerating(true);
            let apiEndpoint = "";

            if (currentPath.includes("event-page") || currentPath.includes("events")) {
                apiEndpoint = "/api/generate-event-image";
            } else if (currentPath.includes("group-page") || currentPath.includes("groups")) {
                apiEndpoint = "/api/generate-group-description";
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    style,
                    interests: selectedInterests,
                    editorContent: editorContent || "Generate an image based on the selected interests.",
                    numImages: 4
                }),
            });

            if (!response.ok) throw new Error("Generation request failed");

            const data = await response.json();
            setImageURLs(data.imageURLs || [data.description]);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Generation Error",
                description: "Failed to generate images. Please try again."
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setSelectedInterests([]);
                    setImageURLs([]);
                }
            }}>
                <DialogTrigger asChild>
                    <Button className="flex gap-2 w-fit" variant="ghost">
                        <Sparkles size={20} /> Generate with AI
                    </Button>
                </DialogTrigger>

                <DialogContent className="flex items-center justify-center w-full max-w-[100vw] h-screen rounded-none bg-transparent overflow-y-auto">
                    {imageURLs.length == 0 && (
                        <div className="flex flex-col gap-8 w-full mt-96 max-w-3xl p-4">
                            <div className="flex flex-col items-start gap-4 justify-center text-white/70">
                                <div className="p-4 text-white/70 bg-white/10 rounded-full w-fit">
                                    <Sparkles size={32} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h1 className="text-2xl font-bold">AI Generation</h1>
                                    <p className="text-white/50">Generate content based on your interests</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="style-select" 
                                className="block text-lg text-white/70 font-medium">Select Image Style:</label>
                                <Select
                                    value={style}
                                    onValueChange={(value: string) => setStyle(value)}>
                                    <SelectTrigger id="style-select">
                                        <SelectValue placeholder="Select a style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageStyles.map((style) => (
                                            <SelectItem key={style}
                                                value={style.toLowerCase().replace(/\s+/g, '-')}>
                                                {style}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="mb-4 flex flex-col gap-2">
                                    <label htmlFor="group-select"
                                        className="block text-lg text-white/70 font-medium">Select Interest Group:</label>
                                    <Select
                                        value={selectedGroup || "all"}
                                        onValueChange={(value: string) => setSelectedGroup(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select interest group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Groups
                                            </SelectItem>
                                            {interestsData?.["interest-groups"].map((group) => (
                                                <SelectItem
                                                    value={group["group-name"]}
                                                    key={group["group-name"]}>
                                                    {group["group-name"]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p>
                                    OR
                                </p>
                                <div className="mb-4 flex flex-col gap-2">
                                    <label htmlFor="search-input"
                                        className="block text-lg text-white/70 font-medium">Search Interests:</label>
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Search interests"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 min-[900px]:max-w-[60%]">
                                {displayedInterests.map((interest) => (
                                    <Button key={interest.name}
                                        variant="outline"
                                        onClick={() => handleInterestClick(interest.name)}>
                                        {interest.name}
                                    </Button>
                                ))}
                            </div>

                            <Button
                                variant="ghost"
                                className="text-blue-500 w-fit"
                                onClick={shuffleInterests}>
                                Show More Interests
                            </Button>

                            <div className="flex flex-col gap-8">
                                {selectedInterests.length > 0 && (
                                    <div className="flex flex-col gap-4">
                                        <h2 className="text-xl tracking-wider font-semibold">Selected Interests</h2>
                                        <div className="flex flex-wrap gap-4 min-[900px]:max-w-[60%]">
                                            {selectedInterests.map((interest) => (
                                                <Button key={interest}
                                                    className="px-4 py-2 bg-transparent border border-blue-500 text-white"
                                                    onClick={() => handleInterestClick(interest)}>
                                                    {interest}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedInterests.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-xl font-semibold">Selected for Generation</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedInterests.map((interest) => (
                                            <Button
                                                key={interest}
                                                variant="outline"
                                                onClick={() => handleInterestClick(interest)}
                                                className="bg-blue-500 text-white"
                                            >
                                                {interest}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <TextEditor {
                                ...{
                                    editorContent: editorContent,
                                    onChange: setEditorContent
                                }
                            } />

                            <HoverBorderGradient
                                onClick={generateRequest}
                                className="w-fit self-end"
                            >
                                {isGenerating ? "Generating..." : "Generate Content"}
                            </HoverBorderGradient>
                        </div>
                    )}
                    {imageURLs.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {isGenerating ? (
                                <BackgroundGradientAnimation className="w-full min-h-[400px] rounded-xl">
                                    <div className="flex w-full h-full bg-black/20 flex-col gap-2 items-center justify-center absolute transform left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                                        <Brain className="w-24 h-24 bg-metallic-gradient bg-clip-text text-white/70"
                                            strokeWidth={2} />
                                        <TextGenerateEffect className="text-white/70"
                                            words="Generating content..." />
                                    </div>
                                </BackgroundGradientAnimation>
                            ) : imageURLs.length > 0 ? (
                                <div className="flex flex-wrap gap-4">
                                    {imageURLs.map((url, index) => (
                                        currentPath.includes("group") ? (
                                            <div key={index}
                                                className="p-4 bg-white/10 rounded-lg text-white">
                                                <p>{url}</p>
                                            </div>
                                        ) : (
                                            <Image
                                                width={2000}
                                                height={2000}
                                                key={index}
                                                src={url}
                                                alt={`Generated Image ${index + 1}`}
                                                className="w-full h-auto rounded-lg"
                                            />
                                        )
                                    ))}
                                </div>
                            ) : null}
                            <div>
                                <Button
                                    variant="ghost"
                                    className="text-blue-500 w-fit"
                                    onClick={() => {
                                        setSelectedInterests([]);
                                        setImageURLs([]);
                                    }}>
                                    Generate New
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-blue-500 w-fit"
                                    onClick={() => {
                                        setSelectedInterests([]);
                                        setImageURLs([]);
                                        setEditorContent("");
                                    }}
                                >Save</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}