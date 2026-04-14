import { NextResponse } from 'next/server';
import { getActiveCarouselSlides } from '@/lib/carousel-storage';

export async function GET() {
  try {
    const slides = await getActiveCarouselSlides();

    return NextResponse.json({
      data: slides,
    });
  } catch (error) {
    console.error('Failed to load public carousel slides:', error);

    return NextResponse.json(
      {
        message: 'Gagal memuat carousel',
      },
      { status: 500 }
    );
  }
}
