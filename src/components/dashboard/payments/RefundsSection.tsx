import { Receipt } from "lucide-react"
import { RefundPolicyDialog } from "../modals/payments/RefundPolicyDialog"
import { useUserContext } from "@/providers/UserContextProvider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { useQuery } from "react-query"
import { useState } from "react"

export const RefundSection = () => {
    const { userId } = useUserContext()
    const supabase = createClientComponentClient<Database>()
    const [policyText, setPolicyText] = useState<string>("")

    const fetchRefundPolicy = useQuery(
        ["refund-policy", userId],
        async () => {
            const { data } = await supabase
                .from("stripe-users")
                .select("refund_policy")
                .eq("user_id", userId)
                .single()

            if (data) {
                setPolicyText(data.refund_policy as string)
            }

            return data
        }, {
        enabled: !!userId
    })

    return (
        <>
            <div className="col-span-2 flex flex-col gap-4 rounded-2xl">
                <hr className="border-white/10 mt-8" />
                <div className="flex items-center justify-between p-4 rounded-lg">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-medium tracking-wide">Your refund policy</h2>
                        <p className="text-sm text-gray-400">Refund policy will be visible on your events</p>
                    </div>
                    <RefundPolicyDialog />
                </div>
                <div className="flex items-start gap-4 bg-[#1a1a1a] p-4 rounded-lg">
                    <Receipt className="text-white/70" size={32} />
                    {!policyText ? (
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide">Refund policy</h2>
                            <p className="text-sm text-gray-400">No refunds</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium tracking-wide">Refund policy</h2>
                            <div className="text-white/70" dangerouslySetInnerHTML={{ __html: policyText }}></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}