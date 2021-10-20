import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

export class File {
  @ApiHideProperty()
  @Exclude()
  id: string;

  name: string;
  mime: string;

  @Type(() => Date)
  createdAt: Date;

  accessableBy: string[];
}
