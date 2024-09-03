"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "../ui/button"
import { useMutation, useQueryClient } from "react-query"
import { Modal } from "@/features/Modal"
import { useState } from "react"
import { Input } from "../ui/input"
import { Database } from "@/types/supabase"
import { GroupCard } from "./GroupCard"
import { Navbar } from "./Navbar"
import { GroupData } from "@/types/types"
import { GroupTopicsModalStep } from "@/features/create-group-modal/GroupTopicsModalStep"
import { GroupDescriptionModalStep } from "@/features/create-group-modal/GroupDescriptionModalStep"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"

export const GroupSection = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [modalStepCount, setModalStepCount] = useState(1)
    const { groupName,
        setGroupName,
        groupCity,
        setGroupCity,
        groupCountry,
        setGroupCountry } = useGroupDataContext()

    const bodyContent = (
        <div className="flex flex-col gap-4">
            {modalStepCount === 1 && (
                <>
                    <div className="flex flex-col gap-4">
                        <Input
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <Input
                            placeholder="Group City"
                            value={groupCity}
                            onChange={(e) => setGroupCity(e.target.value)}
                        />
                        <Input
                            placeholder="Group Country"
                            value={groupCountry}
                            onChange={(e) => setGroupCountry(e.target.value)}
                        />
                    </div>

                    <Button onClick={() => {
                        setModalStepCount(2)
                    }}>Next step</Button>
                </>
            )}

            {modalStepCount === 2 && (
                <>
                    <div className="flex flex-col gap-4">
                        <GroupTopicsModalStep />
                        <div className="flex gap-4">
                            <Button onClick={() => setModalStepCount(1)}>Previous step</Button>
                            <Button onClick={() => setModalStepCount(3)}>Next step</Button>
                        </div>

                    </div>
                </>
            )}

            {modalStepCount === 3 && (
                <div className="flex flex-col gap-4">
                    <GroupDescriptionModalStep />
                    <div className="flex">
                        <Button onClick={() => {
                            setModalStepCount(2)
                        }}>Previous step</Button>
                        <Button onClick={() => { }}>Create group</Button>
                    </div>
                </div>
            )}
        </div >
    )

    return (
        <div className="flex flex-col gap-4">
            <Navbar />
            <div>
                <Button onClick={() => setIsOpen(true)}>Create group</Button>
                <GroupCard />
                <Modal title="Create Group"
                    body={bodyContent}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onChange={setIsOpen}
                />
            </div>
        </div>
    )
}