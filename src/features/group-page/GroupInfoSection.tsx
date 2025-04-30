"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { TextEditor } from "../TextEditor"
import { toast } from "@/components/ui/use-toast"
import { useUserContext } from "@/providers/UserContextProvider"
import { useGroupOwnerContext } from "@/providers/GroupOwnerProvider"
import { usePathname } from "next/navigation"
import { Brain, Edit, Languages, Save, X } from "lucide-react"
import { GenerateDescriptionDialog } from "@/components/dashboard/modals/events/GenerateDescriptionDialog"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"

interface GroupInfoSectionProps {
    groupId: string
}

export const GroupInfoSection = ({ groupId }: GroupInfoSectionProps) => {
    const supabase = createClientComponentClient<Database>()
    const [groupDescription, setGroupDescription] = useState<string>()
    const [translatedGroupDescription, setTranslatedGroupDescription] = useState<string>()
    const [showTranslatedDescription, setShowTranslatedDescription] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSetToEdit, setIsSetToEdit] = useState(false)
    const queryClient = useQueryClient()
    const { userId } = useUserContext()
    const { ownerId } = useGroupOwnerContext()
    const pathname = usePathname()
    const [isTranslating, setIsTranslating] = useState(false)

    useQuery(['groups-description'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("group_description")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupDescription(data[0].group_description as string)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    const translateRequest = async (description: string) => {
        try {
            setIsTranslating(true)
            const response = await fetch("/api/text-translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) throw new Error("Translation request failed");

            const data = await response.json();
            setTranslatedGroupDescription(data.translatedText);
            setShowTranslatedDescription(true);

            return data.translatedText;
        } catch (error) {
            console.error("Error in translateRequest:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const editGroupDescriptionMutation = useMutation(
        async (newGroupDescription: string) => {
            const { data, error } = await supabase
                .from("groups")
                .update({ group_description: newGroupDescription })
                .eq("id", groupId)

            if (error) {
                throw error
            }

            if (data) {
                setIsSetToEdit(false)
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('groups')
                toast({
                    title: "Success",
                    description: "Description updated successfully",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update description",
                    variant: "destructive"
                });
            }
        })

    useQuery(['groups-description'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("group_description")
            .eq("id", groupId)

        if (error) {
            throw error
        }

        if (data) {
            setGroupDescription(data[0].group_description as string)
        }
    },
        {
            cacheTime: 10 * 60 * 1000,
        })

    return (
        <>
            <div className="flex flex-col gap-8 max-w-[1200px] w-full justify-self-center">
                <div className="flex flex-col gap-4 px-8">
                    <h2 className='text-xl font-bold tracking-wider'>Little bit about us</h2>
                    <div className='relative'>
                        {isSetToEdit === false && (
                            <>
                                {!translatedGroupDescription && (
                                    <Button className="w-fit text-white/70 self-end"
                                        variant="ghost"
                                        onClick={() => {
                                            translateRequest(groupDescription as string)
                                        }}>
                                        <Languages size={20} />
                                    </Button>
                                ) || (
                                        <Button
                                            className="w-fit self-end flex gap-2 text-white/70"
                                            variant="ghost"
                                            onClick={() => setShowTranslatedDescription(!setShowTranslatedDescription)}
                                        >
                                            <Languages size={20} /> {showTranslatedDescription ? "Show Original" : "Show Translation"}
                                        </Button>
                                    )}

                                {isTranslating ? (
                                    <div className="flex items-center justify-center">
                                        <BackgroundGradientAnimation className="w-full min-h-[320px] rounded-xl">
                                            <div className="flex w-full h-full bg-black/20 flex-col gap-2 items-center justify-center absolute transform left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2">
                                                <Brain className="w-24 h-24 bg-metallic-gradient bg-clip-text text-white/70"
                                                    strokeWidth={2} />
                                                <TextGenerateEffect className="text-white/70" words="Translating..." />
                                            </div>

                                            <div className="p-4 blur-sm opacity-70" dangerouslySetInnerHTML={{ __html: groupDescription as string }}></div>
                                        </BackgroundGradientAnimation>
                                    </div>
                                ) : showTranslatedDescription === false ? (
                                    <div dangerouslySetInnerHTML={{ __html: groupDescription as string }}></div>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: translatedGroupDescription as string }}></div>
                                )}

                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className='text-blue-500'>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                            </>
                        ) || (

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-4 items-end max-w-[400px]">
                                        <TextEditor {
                                            ...{
                                                editorContent: groupDescription as string,
                                                onChange: setGroupDescription
                                            }
                                        } />
                                        <GenerateDescriptionDialog />
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="ghost"
                                            className="w-fit text-blue-500"
                                            onClick={() => {
                                                editGroupDescriptionMutation.mutate(groupDescription as string)

                                                setIsSetToEdit(false)
                                            }}>
                                            <Save size={20} />
                                        </Button>
                                        <Button variant="ghost"
                                            className="w-fit text-red-500"
                                            onClick={() => setIsSetToEdit(false)}>
                                            <X size={20} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                    </div>
                    {pathname.includes("/dashboard") && userId === ownerId && !isSetToEdit && (
                        <div className="flex gap-4">
                            <Button variant="ghost"
                                className="w-fit text-white/70"
                                onClick={() => setIsSetToEdit(true)}>
                                <Edit size={20} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            
        </>
    )
}