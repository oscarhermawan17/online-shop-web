"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Share2, Instagram, Youtube, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingPage, ErrorMessage } from "@/components/shared"
import { useAdminStore } from "@/hooks"
import { mediaSosialSchema, type MediaSosialFormData } from "@/lib/validations"
import { toast } from "sonner"
import api from "@/lib/api"

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
    </svg>
  )
}

export default function MediaSosialPage() {
  const { store, isLoading, isError, mutate } = useAdminStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MediaSosialFormData>({
    resolver: zodResolver(mediaSosialSchema),
    values: store
      ? {
          instagramUrl: store.instagramUrl || "",
          tiktokUrl: store.tiktokUrl || "",
          youtubeUrl: store.youtubeUrl || "",
        }
      : undefined,
  })

  const onSubmit = async (data: MediaSosialFormData) => {
    setIsSubmitting(true)
    try {
      await api.patch("/admin/store", {
        instagramUrl: data.instagramUrl || null,
        tiktokUrl: data.tiktokUrl || null,
        youtubeUrl: data.youtubeUrl || null,
      })
      toast.success("Media sosial berhasil disimpan")
      mutate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Gagal menyimpan media sosial")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <LoadingPage />
  if (isError) return <ErrorMessage message="Gagal memuat data toko" />

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Sosial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Link media sosial yang ditampilkan di footer website
          </p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Simpan
            </>
          )}
        </Button>
      </div>

      <Card className="border-muted shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Akun Media Sosial
          </CardTitle>
          <CardDescription>
            Kosongkan field untuk menyembunyikan icon di footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="instagramUrl" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagramUrl"
              type="url"
              placeholder="https://instagram.com/namatoko"
              {...register("instagramUrl")}
              disabled={isSubmitting}
            />
            {errors.instagramUrl && (
              <p className="text-sm text-destructive">
                {errors.instagramUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokUrl" className="flex items-center gap-2">
              <TiktokIcon />
              TikTok
            </Label>
            <Input
              id="tiktokUrl"
              type="url"
              placeholder="https://tiktok.com/@namatoko"
              {...register("tiktokUrl")}
              disabled={isSubmitting}
            />
            {errors.tiktokUrl && (
              <p className="text-sm text-destructive">
                {errors.tiktokUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube
            </Label>
            <Input
              id="youtubeUrl"
              type="url"
              placeholder="https://youtube.com/@namatoko"
              {...register("youtubeUrl")}
              disabled={isSubmitting}
            />
            {errors.youtubeUrl && (
              <p className="text-sm text-destructive">
                {errors.youtubeUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
