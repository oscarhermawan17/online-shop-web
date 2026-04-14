import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getCarouselSlides, saveCarouselSlides } from '@/lib/carousel-storage';

function hasBearerToken(request: NextRequest) {
  const authorizationHeader = request.headers.get('authorization');

  return Boolean(
    authorizationHeader &&
      authorizationHeader.startsWith('Bearer ') &&
      authorizationHeader.slice('Bearer '.length).trim()
  );
}

function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      message: 'Unauthorized',
    },
    { status: 401 }
  );
}

export async function GET(request: NextRequest) {
  if (!hasBearerToken(request)) {
    return createUnauthorizedResponse();
  }

  try {
    const slides = await getCarouselSlides();

    return NextResponse.json({
      data: slides,
    });
  } catch (error) {
    console.error('Failed to load admin carousel slides:', error);

    return NextResponse.json(
      {
        message: 'Gagal memuat data carousel',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!hasBearerToken(request)) {
    return createUnauthorizedResponse();
  }

  try {
    const payload = await request.json();
    const slides = await saveCarouselSlides(payload?.slides ?? []);

    return NextResponse.json({
      data: slides,
      message: 'Carousel berhasil disimpan',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.issues[0]?.message ?? 'Data carousel tidak valid',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Failed to save carousel slides:', error);

    return NextResponse.json(
      {
        message: 'Gagal menyimpan carousel',
      },
      { status: 500 }
    );
  }
}
