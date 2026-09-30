import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('purpose') purpose: string,
  ) {
    return this.filesService.upload(userId, file, purpose);
  }

  @Get(':id')
  async downloadFile(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, file } = await this.filesService.getFileStream(
      userId,
      userRole,
      fileId,
    );

    res.set({
      'Content-Type': file.mime,
      'Content-Disposition': `${file.purpose === 'avatar' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    res.status(HttpStatus.OK);
    stream.pipe(res);
  }

  @Delete(':id')
  async deleteFile(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Param('id') fileId: string,
  ) {
    return this.filesService.deleteFile(userId, userRole, fileId);
  }
}
