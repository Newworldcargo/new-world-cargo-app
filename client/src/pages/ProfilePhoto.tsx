import { ArrowLeft, Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function ProfilePhoto() {
  const [, navigate] = useLocation();
  const { user, updateUser } = useAuth();
  const picker = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(user?.avatar || "");
  const initials = `${user?.firstName?.[0] || "C"}${user?.lastName?.[0] || ""}`;
  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
  };
  const save = () => { updateUser({ avatar: preview || undefined }); navigate("/settings/account"); };
  return <div className="mx-auto max-w-xl text-ink">
    <button onClick={() => navigate("/settings/account")} className="inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-3 py-2 text-xs font-bold text-ink"><ArrowLeft className="size-4" /> Back to account</button>
    <div className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Your details</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">Profile photo</h1><p className="mt-2 text-sm leading-6 text-ink/55">Choose a clear photo so New World Cargo can recognise your account when support is helping you.</p></div>
    <section className="mt-7 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-7"><div className="mx-auto grid size-36 place-items-center overflow-hidden rounded-[36px] bg-cargo-yellow text-4xl font-extrabold text-ink">{preview ? <img src={preview} alt="Selected profile preview" className="size-full object-cover" /> : initials}</div><input ref={picker} onChange={selectPhoto} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button onClick={() => picker.current?.click()} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink"><ImagePlus className="mr-2 size-4" /> Choose photo</Button><Button onClick={() => setPreview("")} variant="outline" disabled={!preview} className="h-12 rounded-xl border-ink/15 font-bold text-ink"><Trash2 className="mr-2 size-4" /> Remove photo</Button></div>
      <div className="mt-5 rounded-2xl bg-[#f7f8fb] p-4 text-xs leading-5 text-ink/55"><Camera className="mb-2 size-4 text-ink" /> Use a square image in PNG, JPG, or WebP format. This prototype keeps the selected image in the current browser session; production storage will replace this local preview later.</div>
      <Button onClick={save} className="mt-5 h-12 w-full rounded-xl bg-ink font-bold text-white">Save photo</Button>
    </section>
  </div>;
}
