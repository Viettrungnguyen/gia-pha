/**
 * @project NguyenDinhHoaNgai
 * @file src/components/documents/document-card.tsx
 * @description Document card
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import { FileText, Image as ImageIcon, Video, Map, BookOpen, Download, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileExtension } from '@/lib/supabase-data-documents';
import type { ClanDocument, DocumentCategory } from '@/types';

const ICON_MAP: Record<DocumentCategory, typeof FileText> = {
  anh_lich_su: ImageIcon,
  giay_to: FileText,
  ban_do: Map,
  video: Video,
  bai_viet: BookOpen,
  khac: FileQuestion,
};

const LABEL_MAP: Record<DocumentCategory, string> = {
  anh_lich_su: 'Ảnh lịch sử',
  giay_to: 'Giấy tờ',
  ban_do: 'Bản đồ',
  video: 'Video',
  bai_viet: 'Bài viết',
  khac: 'Khác',
};

const COLOR_MAP: Record<DocumentCategory, string> = {
  anh_lich_su: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  giay_to: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ban_do: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  video: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  bai_viet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  khac: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
};

interface Props {
  document: ClanDocument;
}

export function DocumentCard({ document }: Props) {
  const Icon = ICON_MAP[document.category] ?? FileQuestion;
  const ext = getFileExtension(document.file_type, document.file_url);
  const isImage = document.category === 'anh_lich_su';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={document.file_url} target="_blank" rel="noopener noreferrer">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {isImage ? (
            <img
              src={document.file_url}
              alt={document.title}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <Badge className={COLOR_MAP[document.category]}>
              {LABEL_MAP[document.category]}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <h3 className="line-clamp-2 font-semibold" title={document.title}>{document.title}</h3>
        {document.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{document.description}</p>
        )}
        {document.tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {document.tags.split(',').slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/30 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{ext}</Badge>
          <span>{formatFileSize(document.file_size)}</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
            <Download className="mr-1 h-4 w-4" />
            Tải về
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}