import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { config } from '../../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  static async processAvatar(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

  static async processBanner(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(1200, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

  static async processPostImage(file: Express.Multer.File): Promise<ProcessedImage> {
    const buffer = await sharp(file.path)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const filename = `post-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    await fs.unlink(file.path).catch(() => {});

    return { buffer, filename };
  }

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

  static async uploadToLocal(buffer: Buffer, filename: string, folder: string): Promise<string> {
    const uploadDir = path.join(__dirname, '../../../uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    return `/uploads/${folder}/${filename}`;
  }

  static async deleteFromS3(url: string): Promise<void> {
    if (!s3Client || !config.aws.s3Bucket) return;

    try {
      const urlObj = new URL(url);
      const key = urlObj.pathname.slice(1);

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

  static async deleteFromLocal(url: string): Promise<void> {
    if (!url.startsWith('/uploads/')) return;

    try {
      const filePath = path.join(__dirname, '../../..', url);
      await fs.unlink(filePath);
    } catch {
      // Ignore errors
    }
  }

  static async deleteFile(url: string): Promise<void> {
    if (!url) return;

    if (url.startsWith('https://') && url.includes('s3.')) {
      await this.deleteFromS3(url);
    } else if (url.startsWith('/uploads/')) {
      await this.deleteFromLocal(url);
    }
  }

  static async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processAvatar(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'avatars')
      : await this.uploadToLocal(buffer, filename, 'avatars');

    return { url };
  }

  static async uploadBanner(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processBanner(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'banners')
      : await this.uploadToLocal(buffer, filename, 'banners');

    return { url };
  }

  static async uploadPostImage(file: Express.Multer.File): Promise<UploadResult> {
    const { buffer, filename } = await this.processPostImage(file);

    const url = useS3
      ? await this.uploadToS3(buffer, filename, 'posts')
      : await this.uploadToLocal(buffer, filename, 'posts');

    return { url };
  }

  static async uploadPostImages(files: Express.Multer.File[]): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadPostImage(file))
    );
    return results;
  }
}
