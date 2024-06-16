import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private storage: Storage;
  private bucketName: string;

  constructor(private readonly prismaService: PrismaService) {
    const keyfileJson = JSON.parse(process.env.GCS_KEYFILE_JSON);
    this.storage = new Storage({ credentials: keyfileJson });
    this.bucketName = process.env.GCS_BUCKET_NAME; // Nome do bucket configurado nas variáveis de ambiente
  }

  async uploadBase64Image(base64: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const filename = `${uuidv4()}.png`; // Gera um nome único para o arquivo
    const file = bucket.file(filename);

    const buffer = Buffer.from(
      base64.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/png',
      },
    });

    return new Promise((resolve, reject) => {
      const bufferStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null); // Sinaliza que não há mais dados a serem escritos
        },
      });

      bufferStream
        .pipe(stream)
        .on('error', reject)
        .on('finish', () => {
          resolve(
            `https://storage.googleapis.com/${this.bucketName}/${filename}`,
          );
        });
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const fileName = `images/${uuidv4()}-${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const fileHandle = bucket.file(fileName);
    const stream = fileHandle.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(file.buffer);
    });

    return fileHandle.publicUrl();
  }

  private async uploadPdfToStorage(file: Express.Multer.File): Promise<string> {
    const fileName = `pdfs/${uuidv4()}-${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const fileHandle = bucket.file(fileName);
    const stream = fileHandle.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(file.buffer);
    });

    return fileHandle.publicUrl();
  }

  async uploadReport(file: Express.Multer.File): Promise<string> {
    const reportUrl = await this.uploadPdfToStorage(file);
    return reportUrl;
  }
}
