import { ReceiptDialog } from "../modals/payments/ReceiptDialog"
export const ReceiptsSection = ({ sellerAccountId }: { sellerAccountId: string }) => {
    return (
        <>
            <div className="col-span-1 flex flex-col gap-4">
                <hr className="border-white/10 mt-8" />
                <div className="colspan-1 flex flex-col p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="flex justify-between">
                        <div>
                            <h2 className="text-lg font-medium tracking-wide">Receipts</h2>
                            <p className="text-white/50">You can add a receipt here</p>
                        </div>
                        <ReceiptDialog />
                    </div>
                    <div>
                        <div>
                            <p>Seller name</p>

                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}