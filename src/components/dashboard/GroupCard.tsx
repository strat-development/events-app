import { Database } from "@/types/supabase"
import { GroupData } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { DeleteGroupDialog } from "./modals/DeleteGroupDialog"
import { EditGroupDialog } from "./modals/EditGroupModal"
import Image from "next/image"

export const GroupCard = () => {
    const supabase = createClientComponentClient<Database>();
    const [groupData, setGroupData] = useState<GroupData[]>([]);
    const [imageUrls, setImageUrls] = useState<{ [groupId: string]: string }>({});
    const queryClient = useQueryClient();

    useQuery(['groups'], async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*");
        if (error) {
            throw error;
        }

        if (data) {
            setGroupData(data);
            queryClient.invalidateQueries(['groups']);
        }
    });

    const groupIds = groupData.map(group => group.id);

    const { data: images } = useQuery(
        ['group-pictures', groupIds],
        async () => {
            if (groupIds.length === 0) return [];

            const { data, error } = await supabase
                .from('group-pictures')
                .select('*')
                .in('group_id', groupIds);

            if (error) {
                throw error;
            }

            return data || [];
        },
        {
            enabled: groupIds.length > 0
        }
    );

    useEffect(() => {
        if (images) {
            Promise.all(images.map(async (image) => {
                const { data: publicURL } = await supabase.storage
                    .from('group-pictures')
                    .getPublicUrl(image.hero_picture_url || "");

                return { groupId: image.group_id, publicUrl: publicURL.publicUrl };
            }))
                .then((publicUrls) => {
                    const urlMapping: { [groupId: string]: string } = {};
                    publicUrls.forEach(({ groupId, publicUrl }) => {
                        urlMapping[groupId] = publicUrl;
                    });
                    setImageUrls(urlMapping);
                })
                .catch(console.error);
        }
    }, [images]);

    return (
        <div className="flex flex-col gap-4">
            {groupData?.map((group) => (
                <div key={group.id} className="bg-white p-4 rounded-md shadow-md">
                    <Link href={`/dashboard/group-page/${group.id}`} key={group.id}>
                        {imageUrls[group.id] && (
                            <Image
                                src={imageUrls[group.id]}
                                alt={group.group_name || ""}
                                width={200}
                                height={200}
                                className="mb-4"
                            />
                        )}
                        <h1>{group.group_name}</h1>
                        <p>{group.group_city}</p>
                        <p>{group.group_country}</p>
                    </Link>
                    <div className="flex gap-4">
                        <EditGroupDialog groupId={group.id} />
                        <DeleteGroupDialog groupId={group.id} />
                    </div>
                </div>
            ))}
        </div>
    );
};