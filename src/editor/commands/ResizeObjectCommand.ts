import { UpdateObjectCommand } from './UpdateObjectCommand';

export class ResizeObjectCommand extends UpdateObjectCommand {
  constructor(objectId: string, width: number, height: number) {
    super(objectId, { width, height });
  }
}
