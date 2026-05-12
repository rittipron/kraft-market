import {
  Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { Response, Request } from 'express';
import { Roles, Public } from '../common/decorators';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

@Controller('media')
export class MediaController {

  @Public()
  @Get()
  listFiles() {
    if (!existsSync(UPLOADS_DIR)) return [];
    return readdirSync(UPLOADS_DIR)
      .filter((f) => {
        const ext = extname(f).toLowerCase();
        return ALLOWED_EXT.has(ext);
      })
      .map((f) => {
        const stat = statSync(join(UPLOADS_DIR, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  @Roles('admin', 'staff')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
        cb(null, name);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (ALLOWED_EXT.has(ext)) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      originalName: file.originalname,
    };
  }

  @Roles('admin')
  @Delete(':filename')
  deleteFile(@Param('filename') filename: string) {
    // Prevent path traversal
    if (filename.includes('/') || filename.includes('..')) {
      return { success: false };
    }
    const filepath = join(UPLOADS_DIR, filename);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
      return { success: true };
    }
    return { success: false };
  }
}
