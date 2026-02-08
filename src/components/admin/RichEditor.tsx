"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";

import { useCallback, useEffect, useState } from "react";
import {
    Bold, Italic, Strikethrough, Underline as UnderlineIcon,
    Quote, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight, Youtube as YoutubeIcon,
    Heading1, Heading2, Heading3, Type, Palette, Trash2
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface RichEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export const RichEditor = ({ content, onChange }: RichEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: false,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Youtube.configure({
                controls: false,
            }),
            Placeholder.configure({
                placeholder: "내용을 입력하세요...",
            }),
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            TextStyle,
            Color,
            FontFamily,
        ],
        content,
        editorProps: {
            attributes: {
                class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] p-6 bg-white",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Content Sync: Update editor content when prop changes externally (e.g. AI generation)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if content is significantly different to avoid cursor jumps
            // Or better: Checking difference strictly. 
            // Ideally we compare without tags or simply trust the user won't type while AI generates.
            // For AI generation success, content changes abrupt and fully.
            // If user is typing, content update might cause jump, but here content is state.

            // Check if the difference is "large" or logic based?
            // Simple approach: If editor is empty but content has value (Initial load or AI)
            if (editor.isEmpty && content) {
                editor.commands.setContent(content);
            } else if (Math.abs(editor.getHTML().length - content.length) > 10) {
                // If major change (like AI paste), update
                // This is a naive heuristic but safer than infinite loop
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    // Image Gallery State for deletion UI
    const [images, setImages] = useState<{ src: string; pos: number }[]>([]);
    const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);

    // Extract images from editor content
    const refreshImageList = useCallback(() => {
        if (!editor) return;
        const found: { src: string; pos: number }[] = [];
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'image') {
                found.push({ src: node.attrs.src, pos });
            }
        });
        setImages(found);
    }, [editor]);

    // Delete image at specific position
    const deleteImageAtPos = useCallback((pos: number) => {
        if (!editor) return;
        editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
        // Refresh the list after deletion
        setTimeout(refreshImageList, 100);
    }, [editor, refreshImageList]);

    const uploadImage = useCallback(async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    const data = await res.json();
                    if (data.url) {
                        editor?.chain().focus().setImage({ src: data.url }).run();
                    }
                } catch (err) {
                    console.error("Upload failed", err);
                    alert("이미지 업로드에 실패했습니다. (설정 확인 필요)");
                }
            }
        };
        input.click();
    }, [editor]);

    const addYoutube = useCallback(() => {
        const url = prompt("YouTube URL을 입력하세요:");
        if (url) {
            editor?.chain().focus().setYoutubeVideo({ src: url }).run();
        }
    }, [editor]);

    const uploadVideo = useCallback(async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/mp4,video/webm,video/ogg";
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];

                // Check file size (50MB limit)
                if (file.size > 50 * 1024 * 1024) {
                    alert("파일 크기가 너무 큽니다. 50MB 이하의 파일을 올려주세요.\n\n💡 팁: 유튜브에 업로드 후 '동영상' 버튼으로 링크를 첨부하세요.");
                    return;
                }

                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    const data = await res.json();
                    if (data.url) {
                        // Insert video HTML
                        editor?.chain().focus().insertContent(
                            `<video controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;">
                                <source src="${data.url}" type="${file.type}">
                                브라우저가 비디오를 지원하지 않습니다.
                            </video>`
                        ).run();
                    }
                } catch (err) {
                    console.error("Video upload failed", err);
                    alert("영상 업로드에 실패했습니다.\n\n💡 팁: 유튜브에 업로드 후 '동영상' 버튼으로 링크를 첨부하세요.");
                }
            }
        };
        input.click();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border border-slate-200 rounded-none bg-white">
            {/* Naver Cafe Style Toolbar - Sticky below the main header */}
            <div className="border-b border-slate-200 bg-[#fbfbfb] p-2 flex flex-wrap gap-1 sticky top-[73px] z-10 items-center">

                {/* Font Family (Korean Fonts) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 font-normal w-24 justify-between">
                            <span className="truncate">{editor.getAttributes('textStyle').fontFamily || "기본서체"}</span>
                            <span className="text-[10px]">▼</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontFamily().run()}>기본서체</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('"Pretendard Variable", Pretendard, sans-serif').run()}>프리텐다드</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('"NanumSquareNeo", sans-serif').run()}>나눔스퀘어 네오</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('"GmarketSansMedium", sans-serif').run()}>G마켓 산스</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('"ChosunGu", sans-serif').run()}>조선일보 구딕</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Font Size (Using Headers for now as Tiptap FontSize requires extra extension) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 font-normal w-20 justify-between">
                            크기 <span className="text-[10px]">▼</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>제목 1 (32px)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>제목 2 (24px)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>제목 3 (20px)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>본문 (16px)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>작게 (14px)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="h-4 w-4" />
                </Toggle>

                {/* Color Picker (Simple) */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive("textStyle", { color: '#ef4444' })}
                    onPressedChange={() => {
                        const isRed = editor.isActive("textStyle", { color: '#ef4444' });
                        editor.chain().focus().setColor(isRed ? '#000000' : '#ef4444').run();
                    }}
                >
                    <Palette className="h-4 w-4 text-red-500" />
                </Toggle>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <Toggle size="sm" pressed={editor.isActive({ textAlign: "left" })} onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}>
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: "center" })} onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}>
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: "right" })} onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}>
                    <AlignRight className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <Button variant="ghost" size="sm" onClick={uploadImage} className="gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-xs">사진</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={addYoutube} className="gap-1">
                    <YoutubeIcon className="h-4 w-4" />
                    <span className="text-xs">유튜브</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={uploadVideo} className="gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
                    </svg>
                    <span className="text-xs">영상업로드</span>
                </Button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <Popover open={isImagePopoverOpen} onOpenChange={(open) => {
                    setIsImagePopoverOpen(open);
                    if (open) refreshImageList();
                }}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="이미지 관리 및 삭제"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-xs">삭제</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">본문 이미지 관리</h4>
                                <span className="text-xs text-slate-500">{images.length}개</span>
                            </div>
                            {images.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">
                                    본문에 이미지가 없습니다.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative group aspect-square">
                                            <img
                                                src={img.src}
                                                alt={`이미지 ${i + 1}`}
                                                className="w-full h-full object-cover rounded border border-slate-200"
                                            />
                                            <button
                                                onClick={() => deleteImageAtPos(img.pos)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-slate-400">
                                💡 이미지 위에 마우스를 올리면 삭제 버튼이 나타납니다.
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>

                <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="h-4 w-4" />
                </Toggle>

            </div>

            {/* Editor Content */}
            <div className="editor-container">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
        /* Fonts Import from Noonnu or Google Fonts can be added in Global CSS, or here */
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @import url('https://webfontworld.github.io/naver/NanumSquareNeo.css');
        @import url('https://webfontworld.github.io/gmarket/GmarketSans.css');
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        /* Naver Style Adjustments */
        .ProseMirror {
            min-height: 500px;
            padding: 24px;
            font-size: 16px;
            line-height: 1.6;
        }
        .ProseMirror:focus {
            outline: none;
        }
        .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 10px 0;
        }
      `}</style>
        </div>
    );
};
