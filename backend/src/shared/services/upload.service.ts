import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { config } from '../../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize S3 client if credentials are provided
const s3Client = config.aws.accessKeyId && config.aws.secretAccessKey
  ? new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    })
  : null;

const useS3 = !!s3Client && !!config.aws.s3Bucket;

interface ProcessedImage {
  buffer: Buffer;
  filename: string;
}

interface UploadResult {
  url: string;
}

export class UploadService {
  // Process and resize avatar image
  static async processAvatar(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    // Delete temp file
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

  // Process and resize banner image
  static async processBanner(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(1200, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    // Delete temp file
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

  // Process post image - maintain aspect ratio, limit dimensions
  static async processPostImage(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `post-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    // Delete temp file
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

  // Upload to S3
  static async uploadToS3(buffer: Buffer, filename: string, folder: string): Promise<string> {
    if (!s3Client || !config.aws.s3Bucket) {
      throw new Error('S3 not configured');
    }

    const key = `${folder}/${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      })
    );

    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  }

  // Upload to local filesystem
  static async uploadToLocal(buffer: Buffer, filename: string, folder: string): Promise<string> {
    const uploadDir = path.join(__dirname, '../../../uploads', folder);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    return `/uploads/${folder}/${filename}`;
  }

  // Delete from S3
  static async deleteFromS3(url: string): Promise<void> {
    if (!s3Client || !config.aws.s3Bucket) return;

    try {
      // Extract key from URL
      const urlObj = new URL(url);
      const key = urlObj.pathname.slice(1); // Remove leading /

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: key,
        })
      );
    } catch {
      // Ignore errors
    }
  }

  // Delete from local filesystem
  static async deleteFromLocal(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;

    try {
      const filePath = path.join(__dirname, '../../..', url);
      await fs.unlink(filePath);
    } catch {
      // Ignore errors
    }
  }

  // Delete file (auto-detects storage type)
  static async deleteFile(url: string): Promise<void> {
    if (!url) return;

    if (url.startsWith('https://') && url.includes('s3.')) {
      await this.deleteFromS3(url);
    } else if (url.startsWith('/uploads/')) {
      await this.deleteFromLocal(url);
    }
  }

  // Upload avatar
  static async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processAvatar(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'avatars')
      : await this.uploadToLocal(buffer, filename, 'avatars');

    return { url };
  }

  // Upload banner
  static async uploadBanner(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processBanner(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'banners')
      : await this.uploadToLocal(buffer, filename, 'banners');

    return { url };
  }

  // Upload post image
  static async uploadPostImage(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processPostImage(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'posts')
      : await this.uploadToLocal(buffer, filename, 'posts');

    return { url };
  }

  // Upload multiple post images
  static async uploadPostImages(files: Express.Multer.File[]): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadPostImage(file))
    );
    return results;
  }
}
