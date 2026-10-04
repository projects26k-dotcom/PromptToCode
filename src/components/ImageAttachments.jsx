import React from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export default function ImageAttachments() {
  const { pendingImages, isProcessingImage, removeAttachedImage } = useChatStore();

  if (pendingImages.length === 0 && !isProcessingImage) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto select-none">
      {/* Attached Thumbnails */}
      {pendingImages.map((img) => (
        <div
          key={img.id}
          className="relative group flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-xs transition-all shrink-0 max-w-[180px]"
        >
          {/* Thumbnail preview */}
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 border border-slate-800/60 shrink-0 flex items-center justify-center">
            {img.thumbnail || img.previewUrl ? (
              <img
                src={img.thumbnail || img.previewUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-indigo-400" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[11px] font-medium text-slate-200 truncate" title={img.name}>
              {img.name}
            </p>
            <p className="text-[9px] text-slate-400">
              {img.width && img.height ? `${img.width}×${img.height}` : ''}
              {img.size ? ` • ${(img.size / 1024).toFixed(0)} KB` : ''}
            </p>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAttachedImage(img.id);
            }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Analyzing / Processing Loading Spinner */}
      {isProcessingImage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs shrink-0 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span className="text-[11px] font-medium">Analyzing image...</span>
        </div>
      )}
    </div>
  );
}
