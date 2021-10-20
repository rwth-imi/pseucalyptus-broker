import { Type } from 'class-transformer';

export class File {
  name: string;
  mime: string;

  @Type(() => Date)
  createdAt: Date;

  accessableBy: string[] = [];
}
