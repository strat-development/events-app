import { TextEditor } from "../TextEditor"
import { useGroupDataContext } from "@/providers/GroupDataModalProvider"

export const GroupDescriptionModalStep = () => {
    const { editorContent, setEditorContent } = useGroupDataContext()

    return (
        <div>
            <TextEditor {
                ...{
                    editorContent: editorContent,
                    onChange: setEditorContent
                }
            } />
        </div>
    )
}