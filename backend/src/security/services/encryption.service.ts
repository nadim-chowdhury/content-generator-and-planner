import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    // Get encryption key from environment
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyString) {
      // For development, generate a warning but allow operation
      // In production, this should be required
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ENCRYPTION_KEY environment variable is required in production',
        );
      }
      console.warn(
        '⚠️  ENCRYPTION_KEY not set. Encryption will use a default key (NOT SECURE FOR PRODUCTION)',
      );
      // Generate a default key for development (32 bytes = 64 hex chars)
      this.encryptionKey = randomBytes(this.keyLength);
    } else {
      this.encryptionKey = Buffer.from(keyString, 'hex');

      if (this.encryptionKey.length !== this.keyLength) {
        throw new Error(
          `ENCRYPTION_KEY must be ${this.keyLength * 2} hex characters (${this.keyLength} bytes)`,
        );
      }
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): Promise<string> {
    if (!text) {
      return Promise.resolve(text);
    }

    try {
      // Generate random IV for each encryption
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag for GCM mode
      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + encrypted data
      const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

      return Promise.resolve(result);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): Promise<string> {
    if (!encryptedText) {
      return Promise.resolve(encryptedText);
    }

    try {
      // Split IV, authTag, and encrypted data
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return Promise.resolve(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt an object's specified fields
   */
  async encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[],
  ): Promise<T> {
    const encrypted = { ...data };

    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = (await this.encrypt(
          encrypted[field] as string,
        )) as any;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt an object's specified fields
   */
  async decryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: (keyof T)[],
  ): Promise<T> {
    const decrypted = { ...data };

    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = (await this.decrypt(
            decrypted[field] as string,
          )) as any;
        } catch (error) {
          // If decryption fails, the field might not be encrypted (for backward compatibility)
          // Log but don't throw
          console.warn(
            `Failed to decrypt field ${String(field)}:`,
            error.message,
          );
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash data for searchable encryption (one-way hash for indexing)
   * This allows searching without decrypting all records
   */
  async hashForSearch(text: string): Promise<string> {
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(this.saltLength);
    const hash = (await scryptAsync(text, salt, this.keyLength)) as Buffer;
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify hash for search
   */
  async verifyHash(text: string, hash: string): Promise<boolean> {
    try {
      const scryptAsync = promisify(scrypt);
      const [saltHex, hashHex] = hash.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const computedHash = (await scryptAsync(
        text,
        salt,
        this.keyLength,
      )) as Buffer;
      return computedHash.toString('hex') === hashHex;
    } catch {
      return false;
    }
  }
}
