import 'server-only';

import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { CarouselSlide, CarouselSlideInput } from '@/types';
import {
  carouselSlidesPayloadSchema,
  carouselSlidesSchema,
} from '@/lib/validations';

const DATA_DIRECTORY = path.join(process.cwd(), 'data');
const DATA_FILE_PATH = path.join(DATA_DIRECTORY, 'carousel-slides.json');
const DEFAULT_BACKGROUND_COLOR = '#166534';

const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-minyak-goreng',
    title: 'Grosir Minyak Goreng\nDiskon s/d 15%',
    subtitle: 'Stok terbatas untuk kebutuhan restoran dan katering.',
    badge: 'PROMO UNGGULAN',
    imageUrl: null,
    backgroundColor: '#166534',
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-14T00:00:00.000Z',
  },
  {
    id: 'slide-sembako',
    title: 'Paket Sembako\nMurah & Hemat',
    subtitle: 'Kebutuhan pokok harga grosir untuk UMKM dan rumah tangga.',
    badge: 'HARGA TERBAIK',
    imageUrl: null,
    backgroundColor: '#006f1d',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-14T00:00:00.000Z',
  },
  {
    id: 'slide-peralatan-rumah',
    title: 'Peralatan Rumah\nProduk Berkualitas',
    subtitle: 'Lengkapi dapur Anda dengan peralatan standar resto.',
    badge: 'CUCI GUDANG',
    imageUrl: null,
    backgroundColor: '#064e3b',
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-14T00:00:00.000Z',
  },
];

async function ensureDataFile() {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await readFile(DATA_FILE_PATH, 'utf8');
  } catch {
    await writeFile(
      DATA_FILE_PATH,
      JSON.stringify(DEFAULT_CAROUSEL_SLIDES, null, 2),
      'utf8'
    );
  }
}

async function persistSlides(slides: CarouselSlide[]) {
  await ensureDataFile();
  await writeFile(DATA_FILE_PATH, JSON.stringify(slides, null, 2), 'utf8');
}

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  await ensureDataFile();

  try {
    const fileContent = await readFile(DATA_FILE_PATH, 'utf8');
    const parsedSlides = carouselSlidesSchema.parse(JSON.parse(fileContent));

    return [...parsedSlides].sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    await persistSlides(DEFAULT_CAROUSEL_SLIDES);
    return DEFAULT_CAROUSEL_SLIDES;
  }
}

export async function getActiveCarouselSlides(): Promise<CarouselSlide[]> {
  const slides = await getCarouselSlides();

  return slides.filter((slide) => slide.isActive);
}

export async function saveCarouselSlides(
  inputSlides: CarouselSlideInput[]
): Promise<CarouselSlide[]> {
  const existingSlides = await getCarouselSlides();
  const existingSlidesMap = new Map(
    existingSlides.map((slide) => [slide.id, slide] as const)
  );
  const parsedSlides = carouselSlidesPayloadSchema.parse({
    slides: inputSlides,
  }).slides;
  const timestamp = new Date().toISOString();

  const normalizedSlides: CarouselSlide[] = parsedSlides.map((slide, index) => {
    const existingSlide = slide.id
      ? existingSlidesMap.get(slide.id)
      : undefined;

    return {
      id: slide.id ?? crypto.randomUUID(),
      title: slide.title.trim(),
      subtitle: slide.subtitle?.trim() ?? null,
      badge: slide.badge?.trim() ?? null,
      imageUrl: slide.imageUrl?.trim() ?? null,
      backgroundColor:
        slide.backgroundColor?.trim() ??
        existingSlide?.backgroundColor ??
        DEFAULT_BACKGROUND_COLOR,
      isActive: slide.isActive,
      sortOrder: index,
      createdAt: existingSlide?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
  });

  await persistSlides(normalizedSlides);

  return normalizedSlides;
}
