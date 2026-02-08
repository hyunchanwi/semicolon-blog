"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ArrowLeft, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { RichEditor } from "@/components/admin/RichEditor";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

interface PostEditorProps {
    initialData?: {
        id?: number;
        title: string;
        content: string;
        excerpt: string;
        status: "publish" | "draft";
        categories?: number[];
        featured_media_url?: string;
    };
    categories?: { id: number; name: string }[];
}

export const PostEditor = ({ initialData, categories = [] }: PostEditorProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [status, setStatus] = useState<"publish" | "draft">(initialData?.status || "publish");

    // Thumbnail State (NEW)
    const [thumbnailUrl, setThumbnailUrl] = useState<string>(
        initialData?.featured_media_url || ""
    );
    const [thumbnailId, setThumbnailId] = useState<number | null>(null);

    // AI State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // Single category selection for Naver style
    const [selectedCategory, setSelectedCategory] = useState<string>(
        initialData?.categories?.[0]?.toString() || ""
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const endpoint = initialData?.id
                ? `/api/admin/posts/${initialData.id}`
                : "/api/admin/posts";

            const method = initialData?.id ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    status,
                    categories: selectedCategory ? [parseInt(selectedCategory)] : [],
                    featured_media: thumbnailId || undefined
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "저장 실패");
            }

            router.push("/admin/posts");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // YouTube Video State
    const [suggestedVideos, setSuggestedVideos] = useState<any[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const handleAiGenerate = async () => {
        if (!aiTopic) return;
        setAiLoading(true);
        try {
            const res = await fetch("/api/admin/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: aiTopic }),
            });
            const data = await res.json();

            if (data.content) {
                if (content) {
                    setContent(content + "<br/><br/>" + data.content);
                } else {
                    setContent(data.content);
                }

                if (!title) {
                    const titleMatch = data.content.match(/<h3>(.*?)<\/h3>/);
                    if (titleMatch) setTitle(titleMatch[1]);
                }

                // YouTube 영상이 있으면 선택 모달 표시
                if (data.youtubeVideos && data.youtubeVideos.length > 0) {
                    setSuggestedVideos(data.youtubeVideos);
                    setIsAiModalOpen(false);
                    setIsVideoModalOpen(true);
                } else {
                    setIsAiModalOpen(false);
                }
            } else {
                alert("생성 실패: " + data.error);
            }
        } catch (e) {
            alert("AI 요청 중 오류 발생");
        } finally {
            setAiLoading(false);
        }
    };

    const toggleVideoSelection = (videoId: string) => {
        setSelectedVideos(prev =>
            prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
        );
    };

    const insertSelectedVideos = () => {
        const videosToInsert = suggestedVideos.filter(v => selectedVideos.includes(v.id));

        if (videosToInsert.length > 0) {
            const videosHtml = `
                <div style="margin-top: 32px; padding: 24px; background: #f8f9fa; border-radius: 16px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">🎬 추천 영상</h3>
                    ${videosToInsert.map(video => `
                        <div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 12px; display: flex; gap: 16px;">
                            <a href="${video.watchUrl}" target="_blank" rel="noopener noreferrer" style="flex-shrink: 0;">
                                <img src="${video.thumbnail}" alt="${video.title}" style="width: 160px; height: 90px; border-radius: 8px; object-fit: cover;" />
                            </a>
                            <div>
                                <a href="${video.watchUrl}" target="_blank" rel="noopener noreferrer" style="font-weight: bold; color: #1a1a1a; text-decoration: none; font-size: 14px;">
                                    ${video.title}
                                </a>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${video.channelTitle}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            setContent(content + videosHtml);
        }

        setIsVideoModalOpen(false);
        setSelectedVideos([]);
        setSuggestedVideos([]);
    };

    const handleDelete = async () => {
        if (!initialData?.id || !confirm("정말로 이 글을 삭제하시겠습니까?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/posts/${initialData.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("삭제 실패");
            router.push("/admin/posts");
            router.refresh();
        } catch (e: any) {
            alert(e.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto bg-white min-h-screen shadow-sm border-x border-slate-100">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                        <Link href="/admin/posts">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-bold text-slate-800">
                        {initialData?.id ? "게시글 수정" : "글쓰기"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {initialData?.id && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-2"
                            onClick={handleDelete}
                        >
                            삭제
                        </Button>
                    )}

                    <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="mr-2 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                <Sparkles className="h-4 w-4" />
                                AI 초안 생성
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>AI 블로그 작가 🤖</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <label className="text-sm font-medium mb-2 block">어떤 주제로 글을 쓸까요?</label>
                                <Input
                                    placeholder="예: 아이폰 16 출시 루머, 최신 AI 트렌드..."
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    * Tavily로 최신 뉴스를 검색하고 Gemini가 글을 작성합니다.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAiGenerate} disabled={aiLoading || !aiTopic}>
                                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    {aiLoading ? "글 쓰는 중..." : "글 생성하기"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* YouTube Video Selection Modal */}
                    <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>🎬 추천 영상 선택</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <p className="text-sm text-slate-500 mb-4">
                                    글에 포함할 영상을 선택하세요: ({selectedVideos.length}개 선택됨)
                                </p>
                                <div className="space-y-3">
                                    {suggestedVideos.map((video) => (
                                        <div
                                            key={video.id}
                                            onClick={() => toggleVideoSelection(video.id)}
                                            className={`flex gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedVideos.includes(video.id)
                                                ? "border-primary bg-primary/5"
                                                : "border-transparent bg-slate-50 hover:bg-slate-100"
                                                }`}
                                        >
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold line-clamp-2">{video.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{video.channelTitle}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedVideos.includes(video.id)
                                                    ? "border-primary bg-primary text-white"
                                                    : "border-slate-300"
                                                    }`}>
                                                    {selectedVideos.includes(video.id) && "✓"}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsVideoModalOpen(false)}>
                                    건너뛰기
                                </Button>
                                <Button onClick={insertSelectedVideos} disabled={selectedVideos.length === 0}>
                                    {selectedVideos.length}개 영상 추가
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        type="button"
                        variant="ghost"
                        className="text-slate-500 hover:text-slate-900"
                        onClick={() => setStatus(status === "draft" ? "publish" : "draft")}
                    >
                        {status === "draft" ? "임시저장 상태" : "공개 상태"}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#03c75a] hover:bg-[#02b350] text-white rounded-md px-6 font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "등록"}
                    </Button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="p-8 space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Category Selector (Naver Cafe Style) */}
                <div className="flex items-center gap-4 py-2 border-b border-slate-100">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[300px] border-none shadow-none text-lg font-medium text-slate-600 focus:ring-0 px-0">
                            <SelectValue placeholder="게시판을 선택해 주세요." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                            <SelectItem value="new" disabled className="text-blue-500 font-medium">
                                + 새 카테고리 만들기 (준비중)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Title Input */}
                <div>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력해 주세요."
                        className="text-3xl font-bold border-none shadow-none px-0 placeholder:text-slate-300 focus-visible:ring-0 h-auto py-2"
                        required
                    />
                </div>

                {/* Thumbnail Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">썸네일 이미지</label>
                    <div className="flex items-center gap-4">
                        {thumbnailUrl ? (
                            <div className="relative group">
                                <img
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    className="w-40 h-24 object-cover rounded-lg border border-slate-200"
                                />
                                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                    <label className="cursor-pointer px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30">
                                        변경
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    setIsLoading(true);
                                                    const res = await fetch('/api/admin/upload', {
                                                        method: 'POST',
                                                        body: formData
                                                    });
                                                    if (!res.ok) throw new Error('Upload failed');
                                                    const data = await res.json();
                                                    setThumbnailUrl(data.url);
                                                    setThumbnailId(data.id);
                                                } catch (e) {
                                                    alert("업로드 실패");
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setThumbnailUrl("");
                                            setThumbnailId(null);
                                        }}
                                        className="px-2 py-1 bg-red-500/80 rounded text-xs hover:bg-red-600"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-40 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer relative">
                                <Plus className="h-6 w-6 mb-1" />
                                <span className="text-xs">이미지 업로드</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            setIsLoading(true);
                                            const res = await fetch('/api/admin/upload', {
                                                method: 'POST',
                                                body: formData
                                            });
                                            if (!res.ok) throw new Error('Upload failed');
                                            const data = await res.json();
                                            setThumbnailUrl(data.url);
                                            setThumbnailId(data.id);
                                        } catch (e) {
                                            alert("업로드 실패");
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <div className="text-xs text-slate-400">
                            * 권장 사이즈: 1200x630px (JPG, PNG)<br />
                            * 썸네일은 목록과 상세 페이지 상단에 노출됩니다.
                        </div>
                    </div>
                </div>

                {/* Rich Editor */}
                <div className="min-h-[500px]">
                    <RichEditor content={content} onChange={setContent} />
                </div>
            </div>
        </div>
    );
};
