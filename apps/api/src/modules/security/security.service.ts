import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// Fix: Explicitly import Buffer to resolve missing name error
import { Buffer } from 'buffer';

@Injectable()
export class SecurityService {
  private readonly algorithm = 'aes-256-gcm';
  // Fix: Explicitly type key as Buffer
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('MASTER_ENCRYPTION_KEY');
    if (!secret || secret.length < 32) {
      throw new Error('MASTER_ENCRYPTION_KEY must be at least 32 characters long');
    }
    // Fix: Use Buffer from explicit import
    this.key = Buffer.from(secret.substring(0, 32));
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  decrypt(hash: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = hash.split(':');
      
      // Fix: Use Buffer from explicit import
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted as any, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('Decryption failed');
    }
  }

  async hashPassword(password: string): Promise<string> {
    // In a real production app, use Argon2 or bcrypt
    // Using crypto.scrypt as a secure native alternative
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }
}