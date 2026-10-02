import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get('search')
  searchByUsername(@Query('username') username?: string) {
    if (!username?.trim()) throw new BadRequestException('username query parameter is required');
    return this.policiesService.searchByFirstName(username.trim());
  }

  @Get('by-user')
  aggregateByUser() {
    return this.policiesService.aggregateByUser();
  }
}
