import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' | 'image'
    const businessId = formData.get('businessId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    // Validiere Dateityp
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, GIF' }, { status: 400 });
    }

    // Validiere Dateigröße (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß. Maximum: 5MB' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generiere eindeutigen Dateinamen
    const nameParts = file.name.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const folder = type === 'logo' ? 'logos' : 'gallery';

    // Sanitize businessId - nur alphanumerische Zeichen und Bindestriche erlauben
    const safeBusinessId = businessId
      ? businessId.replace(/[^a-zA-Z0-9-]/g, '')
      : null;

    const fileName = safeBusinessId
      ? `${folder}/${safeBusinessId}/${timestamp}_${randomStr}.${ext}`
      : `${folder}/pending/${timestamp}_${randomStr}.${ext}`;

    // Konvertiere File zu ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload zu Supabase Storage
    const { data, error } = await supabase.storage
      .from('business-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      console.error('Attempted filename:', fileName);
      return NextResponse.json({
        error: 'Upload fehlgeschlagen: ' + error.message,
        details: { fileName, fileType: file.type, fileSize: file.size }
      }, { status: 500 });
    }

    // Generiere öffentliche URL
    const { data: urlData } = supabase.storage
      .from('business-images')
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
