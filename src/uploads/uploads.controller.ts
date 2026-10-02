import {
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { UploadsService } from './uploads.service';

@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  async upload(@Req() request: FastifyRequest) {
    const file = await request.file();
    if (!file) throw new BadRequestException('Send an .xlsx or .csv file in multipart field "file".');
    try {
      return await this.uploadsService.importFile(await file.toBuffer(), file.filename);
    } catch (error) {
      if (error instanceof Error && error.name === 'RequestFileTooLargeError') {
        throw new PayloadTooLargeException('Upload is larger than the configured file limit.');
      }
      throw error;
    }
  }
}
