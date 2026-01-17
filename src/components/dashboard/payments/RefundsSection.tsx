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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-white/90">Refund Policy</h2>
                        <p className="text-sm text-white/60">This policy will be visible on your event pages</p>
                    </div>
                    <RefundPolicyDialog />
                </div>
                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl">
                        <Receipt className="text-white" size={28} />
                    </div>
                    {!policyText ? (
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold text-white/90">Default Policy</h3>
                            <p className="text-sm text-white/60">No refunds available</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 flex-1">
                            <h3 className="text-lg font-semibold text-white/90">Your Policy</h3>
                            <div className="text-sm text-white/70 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: policyText }}></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}