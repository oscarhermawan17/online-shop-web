'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import type { CarouselSlide, CarouselSlideInput } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { carouselSlidesPayloadSchema } from '@/lib/validations';
import { getOptimizedImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const MAX_SLIDES = 10;
const DEFAULT_BACKGROUND_COLOR = '#166534';

function createEmptySlide(index: number): CarouselSlideInput {
  return {
    id: crypto.randomUUID(),
    title: '',
    subtitle: '',
    badge: '',
    imageUrl: '',
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    isActive: true,
    sortOrder: index,
  };
}

function normalizeSlides(slides: CarouselSlideInput[]) {
  return slides.map((slide, index) => ({
    ...slide,
    title: slide.title ?? '',
    subtitle: slide.subtitle ?? '',
    badge: slide.badge ?? '',
    imageUrl: slide.imageUrl ?? '',
    backgroundColor: slide.backgroundColor || DEFAULT_BACKGROUND_COLOR,
    isActive: slide.isActive,
    sortOrder: index,
  }));
}

function mapSlideToEditor(slide: CarouselSlide): CarouselSlideInput {
  return {
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle ?? '',
    badge: slide.badge ?? '',
    imageUrl: slide.imageUrl ?? '',
    backgroundColor: slide.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    isActive: slide.isActive,
    sortOrder: slide.sortOrder,
  };
}

export function CarouselManager() {
  const token = useAuthStore((state) => state.token);
  const [slides, setSlides] = useState<CarouselSlideInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const loadSlides = async () => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/admin/carousel', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Gagal memuat carousel');
        }

        if (!isMounted) {
          return;
        }

        const fetchedSlides: CarouselSlide[] = Array.isArray(result.data)
          ? result.data
          : [];

        setSlides(
          fetchedSlides.length > 0
            ? fetchedSlides.map(mapSlideToEditor)
            : [createEmptySlide(0)]
        );
      } catch (error) {
        console.error('Load carousel error:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Gagal memuat carousel homepage'
        );

        if (isMounted) {
          setSlides([createEmptySlide(0)]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSlides();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSlideChange = <K extends keyof CarouselSlideInput>(
    index: number,
    key: K,
    value: CarouselSlideInput[K]
  ) => {
    setSlides((currentSlides) =>
      currentSlides.map((slide, slideIndex) =>
        slideIndex === index
          ? {
              ...slide,
              [key]: value,
            }
          : slide
      )
    );
  };

  const handleAddSlide = () => {
    if (slides.length >= MAX_SLIDES) {
      toast.error(`Maksimal ${MAX_SLIDES} slide`);
      return;
    }

    setSlides((currentSlides) => [
      ...normalizeSlides(currentSlides),
      createEmptySlide(currentSlides.length),
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length === 1) {
      toast.error('Minimal harus ada 1 slide');
      return;
    }

    setSlides((currentSlides) =>
      normalizeSlides(currentSlides.filter((_, slideIndex) => slideIndex !== index))
    );
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= slides.length) {
      return;
    }

    setSlides((currentSlides) => {
      const nextSlides = [...currentSlides];
      [nextSlides[index], nextSlides[targetIndex]] = [
        nextSlides[targetIndex],
        nextSlides[index],
      ];

      return normalizeSlides(nextSlides);
    });
  };

  const handleImageUpload = async (
    slideId: string | undefined,
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!slideId) {
      toast.error('Slide tidak valid');
      return;
    }

    setUploadingSlideId(slideId);

    try {
      const result = await uploadToCloudinary(file);
      handleSlideChange(index, 'imageUrl', result.secure_url);
      toast.success('Gambar slide berhasil diunggah');
    } catch (error) {
      console.error('Carousel image upload error:', error);
      toast.error('Gagal mengunggah gambar slide');
    } finally {
      setUploadingSlideId(null);
      event.target.value = '';
    }
  };

  const handleSaveSlides = async () => {
    if (!token) {
      toast.error('Sesi admin tidak ditemukan');
      return;
    }

    const normalizedSlides = normalizeSlides(slides);
    const validation = carouselSlidesPayloadSchema.safeParse({
      slides: normalizedSlides,
    });

    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message || 'Data carousel tidak valid'
      );
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slides: normalizedSlides,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan carousel');
      }

      const savedSlides: CarouselSlide[] = Array.isArray(result.data)
        ? result.data
        : [];

      setSlides(savedSlides.map(mapSlideToEditor));
      toast.success('Carousel homepage berhasil disimpan');
    } catch (error) {
      console.error('Save carousel error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan carousel'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-muted shadow-sm">
        <CardContent className="flex min-h-60 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat pengaturan carousel...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Carousel Homepage</CardTitle>
            <CardDescription>
              Atur slide carousel yang tampil di halaman depan toko.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSlide}
              disabled={slides.length >= MAX_SLIDES || isSaving}
            >
              <Plus className="h-4 w-4" />
              Tambah Slide
            </Button>
            <Button
              type="button"
              onClick={handleSaveSlides}
              disabled={isSaving || uploadingSlideId !== null}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Carousel
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Maksimal {MAX_SLIDES} slide. Minimal 1 slide harus aktif agar carousel
          tetap tampil di homepage.
        </div>

        <div className="space-y-6">
          {slides.map((slide, index) => {
            const imageInputId = `carousel-image-${slide.id ?? index}`;
            const isUploadingThisSlide = uploadingSlideId === slide.id;
            const previewBackground = slide.backgroundColor || DEFAULT_BACKGROUND_COLOR;

            return (
              <div
                key={slide.id ?? `slide-${index}`}
                className="rounded-2xl border bg-background p-4 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-4 lg:flex-row">
                  <div
                    className="relative min-h-48 flex-1 overflow-hidden rounded-2xl"
                    style={{ backgroundColor: previewBackground }}
                  >
                    {slide.imageUrl ? (
                      <>
                        <Image
                          src={getOptimizedImageUrl(slide.imageUrl, 1200)}
                          alt={slide.title || `Slide ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent" />
                    )}

                    <div className="relative z-10 flex h-full min-h-48 flex-col justify-center p-6">
                      <span className="mb-3 inline-flex w-fit rounded bg-[#f9fbb7] px-2 py-1 text-[10px] font-bold tracking-[1px] text-[#5e602c] uppercase">
                        {slide.badge || 'BADGE SLIDE'}
                      </span>
                      <h3 className="whitespace-pre-line text-2xl font-extrabold text-white">
                        {slide.title || `Judul slide ${index + 1}`}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-white/90">
                        {slide.subtitle || 'Subjudul slide akan muncul di sini.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-44">
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Slide #{index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          Urutan tampil carousel
                        </p>
                      </div>
                      <Switch
                        checked={slide.isActive}
                        onCheckedChange={(checked) =>
                          handleSlideChange(index, 'isActive', checked)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMoveSlide(index, 'up')}
                      disabled={index === 0 || isSaving}
                    >
                      <ArrowUp className="h-4 w-4" />
                      Naik
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMoveSlide(index, 'down')}
                      disabled={index === slides.length - 1 || isSaving}
                    >
                      <ArrowDown className="h-4 w-4" />
                      Turun
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveSlide(index)}
                      disabled={slides.length === 1 || isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`carousel-title-${slide.id}`}>Judul Slide</Label>
                    <Textarea
                      id={`carousel-title-${slide.id}`}
                      rows={2}
                      value={slide.title}
                      onChange={(event) =>
                        handleSlideChange(index, 'title', event.target.value)
                      }
                      placeholder="Contoh: Promo Minyak Goreng"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`carousel-subtitle-${slide.id}`}>
                      Subjudul
                    </Label>
                    <Textarea
                      id={`carousel-subtitle-${slide.id}`}
                      rows={3}
                      value={slide.subtitle || ''}
                      onChange={(event) =>
                        handleSlideChange(index, 'subtitle', event.target.value)
                      }
                      placeholder="Deskripsi singkat promo atau informasi slide"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`carousel-badge-${slide.id}`}>Badge</Label>
                    <Input
                      id={`carousel-badge-${slide.id}`}
                      value={slide.badge || ''}
                      onChange={(event) =>
                        handleSlideChange(index, 'badge', event.target.value)
                      }
                      placeholder="Contoh: PROMO UNGGULAN"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`carousel-color-${slide.id}`}>
                      Warna Latar Fallback
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`carousel-color-${slide.id}`}
                        value={slide.backgroundColor || DEFAULT_BACKGROUND_COLOR}
                        onChange={(event) =>
                          handleSlideChange(
                            index,
                            'backgroundColor',
                            event.target.value
                          )
                        }
                        placeholder="#166534"
                        disabled={isSaving}
                      />
                      <input
                        type="color"
                        aria-label="Pilih warna slide"
                        value={slide.backgroundColor || DEFAULT_BACKGROUND_COLOR}
                        onChange={(event) =>
                          handleSlideChange(
                            index,
                            'backgroundColor',
                            event.target.value
                          )
                        }
                        disabled={isSaving}
                        className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Gambar Slide</Label>
                    <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Upload gambar untuk slide ini
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Jika kosong, slide akan memakai warna latar saja.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Label
                          htmlFor={imageInputId}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          {isUploadingThisSlide ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Mengunggah...
                            </>
                          ) : (
                            <>
                              <ImagePlus className="h-4 w-4" />
                              Upload Gambar
                            </>
                          )}
                        </Label>
                        <input
                          id={imageInputId}
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            void handleImageUpload(slide.id, index, event)
                          }
                          className="hidden"
                          disabled={isSaving || isUploadingThisSlide}
                        />

                        {slide.imageUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSlideChange(index, 'imageUrl', '')}
                            disabled={isSaving || isUploadingThisSlide}
                          >
                            Hapus Gambar
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {slide.imageUrl ? (
                      <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Gambar aktif: {slide.imageUrl}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
