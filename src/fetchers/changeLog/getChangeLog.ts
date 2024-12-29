import { client } from "@/lib/apollo-client"
import { GetChangeLogDocument } from "@/app/queries/changeLog/GetChangeLog.generated"
import { GetChangeLogQuery } from "@/types/graphQlTypes"

export const getChangelog = async () => {
    const { data: changeLog } = await client.query<GetChangeLogQuery>({
        query: GetChangeLogDocument
    })

    return changeLog
}