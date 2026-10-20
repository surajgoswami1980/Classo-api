import { Controller, Get, Post, Query, Req, Res, HttpCode } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { BiometricService } from './biometric.service';

/**
 * ZKTeco / eSSL ADMS push endpoints. Unauthenticated by design (the machines
 * can't send tokens); only serial numbers registered by an admin are accepted.
 * Responses must be plain text.
 */
@ApiExcludeController()
@Controller('iclock')
export class IclockController {
  constructor(private readonly biometric: BiometricService) {}

  private ip(req: Request) {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  }

  @Get('cdata')
  async handshake(@Query('SN') sn: string, @Req() req: Request, @Res() res: Response) {
    res.type('text/plain').send(await this.biometric.handshake(String(sn || ''), this.ip(req)));
  }

  @Post('cdata')
  @HttpCode(200)
  async data(@Query('SN') sn: string, @Query('table') table: string, @Req() req: any, @Res() res: Response) {
    const raw: string = req.rawBody ? req.rawBody.toString('utf8') : typeof req.body === 'string' ? req.body : '';
    res.type('text/plain').send(await this.biometric.receive(String(sn || ''), String(table || ''), raw, this.ip(req)));
  }

  @Get('getrequest')
  getRequest(@Res() res: Response) {
    res.type('text/plain').send('OK');
  }

  @Post('devicecmd')
  @HttpCode(200)
  deviceCmd(@Res() res: Response) {
    res.type('text/plain').send('OK');
  }
}
