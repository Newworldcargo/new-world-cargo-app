import { ArrowLeft, Camera, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteFileUploadMutation, useFileUploadIntentMutation } from "@/api/hooks";
import { portalDataMode } from "@/api/repository";
import { Button } from "@/components/ui/button";

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function ProfilePhoto() {
  const [, navigate] = useLocation();
  const { user, updateUser } = useAuth();
  const picker = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(user?.avatar || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState("");
  const previewObjectUrl = useRef<string | null>(null);
  const uploadIntent = useFileUploadIntentMutation();
  const completeUpload = useCompleteFileUploadMutation();
  const initials = `${user?.firstName?.[0] || "C"}${user?.lastName?.[0] || ""}`;
  const clearObjectPreview = () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = null;
  };
  useEffect(() => () => clearObjectPreview(), []);
  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!PROFILE_PHOTO_TYPES.has(file.type)) {
      setSaveError("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setSaveError("Choose a photo smaller than 5 MB.");
      return;
    }
    clearObjectPreview();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrl.current = objectUrl;
    setSaveError("");
    setSelectedFile(file);
    setPreview(objectUrl);
  };
  const removePhoto = () => {
    clearObjectPreview();
    setSelectedFile(null);
    setPreview("");
    setSaveError("");
  };
  const save = async () => {
    setSaveError("");
    try {
      if (selectedFile && portalDataMode === "http") {
        const intent = await uploadIntent.mutateAsync({
          filename: selectedFile.name,
          contentType: selectedFile.type,
          sizeBytes: selectedFile.size,
          purpose: "profile-photo",
        });
        const response = await fetch(intent.uploadUrl, { method: "PUT", headers: intent.headers, body: selectedFile });
        if (!response.ok) throw new Error("The photo could not be uploaded. Please try again.");
        const uploaded = await completeUpload.mutateAsync(intent.fileId);
        updateUser({ avatar: uploaded.url });
      } else {
        updateUser({ avatar: preview || undefined });
      }
      navigate("/settings/account");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The photo could not be saved. Please try again.");
    }
  };
  return <div className="mx-auto max-w-xl text-ink">
    <button onClick={() => navigate("/settings/account")} className="inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-3 py-2 text-xs font-bold text-ink"><ArrowLeft className="size-4" /> Back to account</button>
    <div className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Your details</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">Profile photo</h1><p className="mt-2 text-sm leading-6 text-ink/55">Choose a clear photo so New World Cargo can recognise your account when support is helping you.</p></div>
    <section className="mt-7 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-7"><div className="mx-auto grid size-36 place-items-center overflow-hidden rounded-[36px] bg-cargo-yellow text-4xl font-extrabold text-ink">{preview ? <img src={preview} alt="Selected profile preview" className="size-full object-cover" /> : initials}</div><input ref={picker} onChange={selectPhoto} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button onClick={() => picker.current?.click()} disabled={uploadIntent.isPending || completeUpload.isPending} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink"><ImagePlus className="mr-2 size-4" /> Choose photo</Button><Button onClick={removePhoto} variant="outline" disabled={!preview || uploadIntent.isPending || completeUpload.isPending} className="h-12 rounded-xl border-ink/15 font-bold text-ink"><Trash2 className="mr-2 size-4" /> Remove photo</Button></div>
      <div className="mt-5 rounded-2xl bg-[#f7f8fb] p-4 text-xs leading-5 text-ink/55"><Camera className="mb-2 size-4 text-ink" /> Use a square PNG, JPG, or WebP image smaller than 5 MB. The live API issues a short-lived upload URL, then stores only the completed file reference on your profile.</div>
      {saveError ? <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{saveError}</p> : null}
      <Button onClick={() => void save()} disabled={uploadIntent.isPending || completeUpload.isPending} className="mt-5 h-12 w-full rounded-xl bg-ink font-bold text-white">{uploadIntent.isPending || completeUpload.isPending ? "Saving photo…" : "Save photo"}</Button>
    </section>
  </div>;
}
