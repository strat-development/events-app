import { Toggle } from "@/components/ui/toggle"
import {
    Heading2,
    Bold,
    Strikethrough,
    Italic,
    List,
    ListOrdered
} from "lucide-react"
import { type Editor } from "@tiptap/react"

interface TextEditorToolBarProps {
    editor: Editor | null
}

export const TextEditorToolBar = ({ editor }: TextEditorToolBarProps) => {
    return (
        <>
            <div className="flex gap-4 p-1 border-[1px] rounded-md w-fit">
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('heading')}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('bold')}
                    onClick={() => editor?.chain().focus().toggleBold().run()}>
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('italic')}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}>
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('strike')}
                    onClick={() => editor?.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('bulletList')}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor?.isActive('orderedList')}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="h-4 w-4" />
                </Toggle>

            </div>
        </>
    )
}
