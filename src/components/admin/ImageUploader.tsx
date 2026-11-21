'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, X, Loader2, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  folder?: string;
  value?: string;
  values?: string[];
  onChange?: (url: string) => void;
  onImagesChange?: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function ImageUploader({
  label = 'Product Image',
  folder = 'products',
  value = '',
  values,
  onChange,
  onImagesChange,
  multiple = false,
  maxFiles = 6,
  className = '',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active list of image URLs
  const currentImages: string[] = multiple
    ? values || (value ? [value] : [])
    : value
    ? [value]
    : [];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      setError(`Invalid file type "${file.type}". Please upload an image.`);
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image to Cloudflare R2');
    }

    return data.url as string;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setSuccessMsg(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const filesToUpload = Array.from(files).slice(
        0,
        multiple ? maxFiles - currentImages.length : 1
      );

      if (filesToUpload.length === 0) {
        setError(`Maximum of ${maxFiles} images reached.`);
        setIsUploading(false);
        return;
      }

      const uploadedUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 85));
        const url = await uploadFile(filesToUpload[i]);
        if (url) {
          uploadedUrls.push(url);
        }
      }

      setUploadProgress(100);

      if (multiple) {
        const combined = [...currentImages, ...uploadedUrls];
        if (onImagesChange) {
          onImagesChange(combined);
        } else if (onChange && combined[0]) {
          onChange(combined[0]);
        }
      } else {
        if (uploadedUrls[0]) {
          if (onChange) onChange(uploadedUrls[0]);
          if (onImagesChange) onImagesChange([uploadedUrls[0]]);
        }
      }

      setSuccessMsg(`Successfully uploaded ${uploadedUrls.length} image(s) to Cloudflare R2.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    if (multiple) {
      if (onImagesChange) onImagesChange(updated);
    } else {
      if (onChange) onChange('');
      if (onImagesChange) onImagesChange([]);
    }
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = currentImages[index];
    const rest = currentImages.filter((_, idx) => idx !== index);
    const updated = [target, ...rest];
    if (onImagesChange) onImagesChange(updated);
    if (onChange) onChange(target);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
            {label} {multiple && `(${currentImages.length}/${maxFiles})`}
          </label>
          <span className="text-[11px] text-slate-500 font-mono">R2: kravion-auto</span>
        </div>
      )}

      {/* Upload Zone */}
      {(!multiple && currentImages.length === 0) || (multiple && currentImages.length < maxFiles) ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all duration-200 text-center flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#DC2626] bg-red-50/40'
              : 'border-[#E2E8F0] bg-white hover:border-red-300 hover:bg-[#F8FAFC]'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#DC2626] shadow-sm">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#DC2626]" />
            ) : (
              <UploadCloud className="w-6 h-6 text-[#DC2626]" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[#0F172A]">
              <span className="text-[#DC2626] font-semibold underline underline-offset-2">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports WEBP, PNG, JPG, AVIF up to 10MB (stored on Cloudflare R2 CDN)
            </p>
          </div>

          {isUploading && uploadProgress !== null && (
            <div className="w-full max-w-xs mt-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
                <div
                  className="h-full bg-[#DC2626] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-[#DC2626] mt-1 text-center font-mono font-medium">
                Uploading to Cloudflare R2... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Error & Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Image Preview List */}
      {currentImages.length > 0 && (
        <div className={`grid gap-3 ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'}`}>
          {currentImages.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className="group relative rounded-xl overflow-hidden border border-[#E2E8F0] bg-white aspect-video flex items-center justify-center shadow-subtle"
            >
              <img
                src={imgUrl}
                alt={`Image preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badges & Actions Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  {idx === 0 && multiple ? (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-[#DC2626] text-white px-2 py-0.5 rounded shadow">
                      <Star className="w-3 h-3 fill-current" /> Primary
                    </span>
                  ) : multiple ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="text-[10px] font-semibold bg-white/90 hover:bg-[#DC2626] hover:text-white text-slate-800 px-2 py-0.5 rounded transition-colors shadow"
                      title="Set as primary product photo"
                    >
                      Make Primary
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="truncate text-[10px] text-white font-mono bg-black/60 px-1.5 py-0.5 rounded backdrop-blur">
                  {imgUrl.split('/').pop()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}