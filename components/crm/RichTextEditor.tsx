'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import { useEffect, useCallback, memo } from 'react'
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Link as LinkIcon, ImageIcon,
    Heading1, Heading2, Heading3, Undo, Redo, Palette,
    Quote, Minus
} from 'lucide-react'

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
}

const ToolbarButton = memo(function ToolbarButton({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
}: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                active
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'text-foreground-secondary hover:bg-secondary hover:text-foreground border border-transparent'
            } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    )
})

function ToolbarSeparator() {
    return <div className="w-px h-6 bg-border mx-1" />
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline' },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                inline: false,
                HTMLAttributes: { style: 'max-width: 100%; height: auto;' },
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Sync external content changes (e.g. from AI generation)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
    }, [content, editor])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL do link:', previousUrl)
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addImage = useCallback(() => {
        if (!editor) return
        const url = window.prompt('URL da imagem:')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }, [editor])

    const setColor = useCallback(() => {
        if (!editor) return
        const color = window.prompt('Cor (hex):', '#ff0000')
        if (color) {
            editor.chain().focus().setColor(color).run()
        }
    }, [editor])

    if (!editor) return null

    return (
        <div className="border border-border rounded-[var(--radius)] overflow-hidden bg-card">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-secondary/50">
                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Desfazer"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Refazer"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="Título 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Título 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Título 3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Negrito"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Itálico"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Sublinhado"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    title="Riscado"
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Alinhar à esquerda"
                >
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Centralizar"
                >
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Alinhar à direita"
                >
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    active={editor.isActive({ textAlign: 'justify' })}
                    title="Justificar"
                >
                    <AlignJustify className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Lista"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Lista numerada"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Blockquote & HR */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Citação"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Linha horizontal"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarSeparator />

                {/* Link, Image, Color */}
                <ToolbarButton
                    onClick={setLink}
                    active={editor.isActive('link')}
                    title="Inserir link"
                >
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addImage} title="Inserir imagem">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={setColor} title="Cor do texto">
                    <Palette className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />
        </div>
    )
}
