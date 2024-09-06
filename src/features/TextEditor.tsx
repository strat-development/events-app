'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextEditorToolBar } from './TextEditorToolBar'
import Heading from '@tiptap/extension-heading'

export const TextEditor = ({
    editorContent,
    onChange
}: {
    editorContent: string
    onChange: (content: string) => void
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            Heading.configure({
                HTMLAttributes: {
                    class: 'text-2xl font-bold',
                    levels: [2]
                }
            })
        ],
        content: editorContent,
        editorProps: {
            attributes: {
                class: 'rounded-md border min-h-[200px] p-2'
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        }
    })

    return (
        <>
            <div className='flex flex-col gap-4'>
                <TextEditorToolBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        </>
    )
}