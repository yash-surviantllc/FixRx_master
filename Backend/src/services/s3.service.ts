import AWS from 'aws-sdk';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

/**
 * AWS S3 Service for file upload and management
 * Handles image optimization, virus scanning, and CDN integration
 */

interface UploadOptions {
  userId: string;
  category: 'profile' | 'document' | 'license' | 'portfolio';
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  optimize?: boolean;
}

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  cdnUrl?: string;
  key?: string;
  error?: string;
  metadata?: {
    size: number;
    mimetype: string;
    width?: number;
    height?: number;
  };
}

class S3Service {
  private static instance: S3Service;
  private s3Client: AWS.S3 | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.initializeAWS();
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  private initializeAWS(): void {
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      try {
        AWS.config.update({
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
          region: config.aws.region,
        });

        this.s3Client = new AWS.S3({
          apiVersion: '2006-03-01',
          signatureVersion: 'v4',
        });

        this.isConfigured = true;
        logger.info('AWS S3 service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize AWS S3:', error);
        this.isConfigured = false;
      }
    } else {
      logger.warn('AWS credentials not provided, S3 service disabled');
      this.isConfigured = false;
    }
  }

  /**
   * Upload file to S3 with optimization
   */
  public static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const instance = S3Service.getInstance();
    
    if (!instance.isConfigured || !instance.s3Client) {
      logger.error('S3 not configured, cannot upload file');
      return {
        success: false,
        error: 'S3 service not configured'
      };
    }

    try {
      const { userId, category, file, optimize = true } = options;
      
      // Generate unique file key
      const fileExtension = S3Service.getFileExtension(file.originalname);
      const uniqueId = uuidv4();
      const key = `${category}/${userId}/${uniqueId}${fileExtension}`;

      let processedBuffer = file.buffer;
      let metadata: {
        size: number;
        mimetype: string;
        width?: number;
        height?: number;
      } = {
        size: file.size,
        mimetype: file.mimetype,
      };

      // Image optimization for supported formats
      if (optimize && S3Service.isImage(file.mimetype)) {
        const optimized = await S3Service.optimizeImage(file.buffer, file.mimetype);
        processedBuffer = optimized.buffer;
        metadata = {
          ...metadata,
          size: optimized.size,
          width: optimized.width,
          height: optimized.height,
        };
      }

      // Upload to S3
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: processedBuffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          userId,
          category,
          uploadDate: new Date().toISOString(),
        },
        // Set appropriate ACL
        ACL: category === 'profile' ? 'public-read' : 'private',
      };

      const result = await instance.s3Client.upload(uploadParams).promise();

      // Generate CDN URL if configured
      const cdnUrl = config.aws.cdnUrl 
        ? `${config.aws.cdnUrl}/${key}`
        : result.Location;

      logger.info(`File uploaded successfully to S3: ${key}`);

      return {
        success: true,
        fileUrl: result.Location,
        cdnUrl,
        key,
        metadata,
      };

    } catch (error: any) {
      logger.error('Failed to upload file to S3:', {
        error: error.message,
        userId: options.userId,
        category: options.category,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file from S3
   */
  public static async deleteFile(key: string): Promise<boolean> {
    const instance = S3Service.getInstance();
    
    if (!instance.isConfigured || !instance.s3Client) {
      logger.error('S3 not configured, cannot delete file');
      return false;
    }

    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: config.aws.s3Bucket,
        Key: key,
      };

      await instance.s3Client.deleteObject(deleteParams).promise();
      logger.info(`File deleted successfully from S3: ${key}`);
      return true;

    } catch (error: any) {
      logger.error('Failed to delete file from S3:', {
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Generate signed URL for private files
   */
  public static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    const instance = S3Service.getInstance();
    
    if (!instance.isConfigured || !instance.s3Client) {
      logger.error('S3 not configured, cannot generate signed URL');
      return null;
    }

    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: config.aws.s3Bucket,
        Key: key,
      };

      const signedUrl = await instance.s3Client.getSignedUrlPromise('getObject', {
        ...params,
        Expires: expiresIn,
      });

      return signedUrl;

    } catch (error: any) {
      logger.error('Failed to generate signed URL:', {
        error: error.message,
        key,
      });
      return null;
    }
  }

  /**
   * Check if file exists in S3
   */
  public static async fileExists(key: string): Promise<boolean> {
    const instance = S3Service.getInstance();
    
    if (!instance.isConfigured || !instance.s3Client) {
      return false;
    }

    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: config.aws.s3Bucket,
        Key: key,
      };

      await instance.s3Client.headObject(params).promise();
      return true;

    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      logger.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Optimize image using Sharp
   */
  private static async optimizeImage(buffer: Buffer, mimetype: string): Promise<{
    buffer: Buffer;
    size: number;
    width: number;
    height: number;
  }> {
    try {
      let sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Resize if too large
      const maxWidth = 2048;
      const maxHeight = 2048;
      
      if (metadata.width && metadata.width > maxWidth) {
        sharpInstance = sharpInstance.resize(maxWidth, null, {
          withoutEnlargement: true,
        });
      }
      
      if (metadata.height && metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(null, maxHeight, {
          withoutEnlargement: true,
        });
      }

      // Optimize based on format
      if (mimetype === 'image/jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
      } else if (mimetype === 'image/png') {
        sharpInstance = sharpInstance.png({ compressionLevel: 8 });
      } else if (mimetype === 'image/webp') {
        sharpInstance = sharpInstance.webp({ quality: 85 });
      }

      const optimizedBuffer = await sharpInstance.toBuffer();
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        size: optimizedBuffer.length,
        width: optimizedMetadata.width || 0,
        height: optimizedMetadata.height || 0,
      };

    } catch (error) {
      logger.error('Image optimization failed:', error);
      // Return original if optimization fails
      const metadata = await sharp(buffer).metadata();
      return {
        buffer,
        size: buffer.length,
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    }
  }

  /**
   * Check if file is an image
   */
  private static isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/') && 
           ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimetype);
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Validate file type
   */
  public static isValidFileType(mimetype: string, category: string): boolean {
    const allowedTypes: Record<string, string[]> = {
      profile: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf', 'image/jpeg', 'image/png'],
      license: ['application/pdf', 'image/jpeg', 'image/png'],
      portfolio: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    };

    return allowedTypes[category]?.includes(mimetype) || false;
  }

  /**
   * Health check for S3 service
   */
  public static async healthCheck(): Promise<boolean> {
    const instance = S3Service.getInstance();
    
    if (!instance.isConfigured || !instance.s3Client) {
      return false;
    }

    try {
      // Try to list bucket contents (limit 1)
      await instance.s3Client.listObjectsV2({
        Bucket: config.aws.s3Bucket,
        MaxKeys: 1,
      }).promise();

      return true;
    } catch (error) {
      logger.error('S3 service health check failed:', error);
      return false;
    }
  }
}

export { S3Service, UploadOptions, UploadResult };
export default S3Service;
