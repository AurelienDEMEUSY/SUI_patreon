'use client';

import { useState, useRef, useCallback } from 'react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import type { Creator } from '@/types';

interface EditProfileFormProps {
    creator: Creator;
    serviceObjectId: string;
    onSuccess?: () => void;
}

function extractBlobId(urlOrId: string | null): string {
    if (!urlOrId) return '';
    const parts = urlOrId.split('/');
    return parts[parts.length - 1] || '';
}

export function EditProfileForm({ creator, serviceObjectId, onSuccess }: EditProfileFormProps) {
    const [name, setName] = useState(creator.name);
    const [bio, setBio] = useState(creator.bio);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(creator.avatarBlobId);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { updateProfile, isLoading, step, error } = useUpdateProfile();

    const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5 MB');
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5 MB');
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSuccess(false);

        const ok = await updateProfile(serviceObjectId, {
            name: name.trim(),
            description: bio.trim(),
            avatarFile,
            currentAvatarBlobId: extractBlobId(creator.avatarBlobId),
        });

        if (ok) {
            setSuccess(true);
            setAvatarFile(null);
            onSuccess?.();
        }
    };

    const stepLabel =
        step === 'uploading' ? 'Uploading image to Walrus…' :
        step === 'signing' ? 'Signing transaction…' :
        null;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── Avatar section ── */}
            <div className="flex flex-col items-center gap-4">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {/* Avatar preview */}
                    <div className="w-32 h-32 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-[#3c3cf6]/50 transition-all duration-300 bg-black">
                        <img
                            src={avatarPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop'}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-2xl text-white">photo_camera</span>
                            <p className="text-[10px] text-white/80 font-bold mt-1">Change Photo</p>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>

                <p className="text-[11px] text-gray-500">
                    Click or drag & drop · JPG, PNG, WebP · Max 5 MB
                </p>

                {avatarFile && (
                    <button
                        type="button"
                        onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(creator.avatarBlobId);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                    >
                        Remove new image
                    </button>
                )}
            </div>

            {/* ── Name ── */}
            <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                    Creator Name *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    required
                    maxLength={50}
                    className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium"
                />
            </div>

            {/* ── Bio ── */}
            <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                    Bio
                </label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your subscribers about yourself…"
                    rows={4}
                    maxLength={200}
                    className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3c3cf6]/50 focus:ring-1 focus:ring-[#3c3cf6]/30 transition-all text-sm font-medium resize-none"
                />
                <span className="text-[10px] text-gray-600 mt-1 block text-right">
                    {bio.length}/200
                </span>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 px-4 py-3 rounded-xl">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </div>
            )}

            {/* ── Success ── */}
            {success && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-4 py-3 rounded-xl">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Profile updated on-chain!
                </div>
            )}

            {/* ── Submit ── */}
            <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="w-full h-13 bg-linear-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_-5px_rgba(60,60,246,0.4)] hover:shadow-[0_0_40px_-5px_rgba(60,60,246,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-3.5"
            >
                {isLoading ? (
                    <>
                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        {stepLabel}
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Changes on Sui
                    </>
                )}
            </button>
        </form>
    );
}
