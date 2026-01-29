import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, getR2PublicUrl } from '@/lib/r2-client';
import { saveImageMetadata, type ImageMetadata } from '@/lib/image-database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check R2 configuration
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('R2 configuration missing:', {
        hasAccountId: !!process.env.R2_ACCOUNT_ID,
        hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      });
      return NextResponse.json(
        { error: 'R2 configuration incomplete. Check environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const emotions = formData.get('emotions') as string;
    const category = formData.get('category') as string | null;
    const type = formData.get('type') as 'foreground' | 'background';
    const uploadedBy = formData.get('uploadedBy') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['foreground', 'background'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "foreground" or "background"' },
        { status: 400 }
      );
    }

    // Parse emotions (comma-separated string)
    const emotionArray = emotions
      ? emotions.split(',').map(e => e.trim()).filter(e => e.length > 0)
      : [];

    if (emotionArray.length === 0 && type === 'foreground') {
      return NextResponse.json(
        { error: 'At least one emotion tag is required for foreground images' },
        { status: 400 }
      );
    }

    // Generate unique ID and R2 key
    const imageId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'png';
    const r2Key = `${type}s/${imageId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type || `image/${fileExtension}`,
      });

      await r2Client.send(uploadCommand);
      console.log('Successfully uploaded to R2:', r2Key);
    } catch (r2Error) {
      console.error('R2 upload error:', r2Error);
      throw new Error(`Failed to upload to R2: ${r2Error instanceof Error ? r2Error.message : 'Unknown error'}`);
    }

    // Get public URL
    let publicUrl: string;
    try {
      publicUrl = getR2PublicUrl(r2Key);
    } catch (urlError) {
      console.error('Failed to generate public URL:', urlError);
      throw new Error(`Failed to generate public URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
    }

    // Save metadata to Redis
    const metadata: ImageMetadata = {
      id: imageId,
      filename: file.name,
      r2Key,
      publicUrl,
      emotions: emotionArray,
      category: category || undefined,
      uploadedBy: uploadedBy || undefined,
      uploadedAt: Date.now(),
      type,
    };

    try {
      await saveImageMetadata(metadata);
      console.log('Successfully saved metadata to Redis:', imageId);
    } catch (redisError) {
      console.error('Redis save error:', redisError);
      // Don't fail the upload if Redis fails - the file is already uploaded
      console.warn('Image uploaded to R2 but failed to save metadata to Redis');
    }

    return NextResponse.json({
      success: true,
      image: metadata,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
