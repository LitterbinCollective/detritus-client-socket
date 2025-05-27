import { struct, opaque, Struct } from '../../../utils/base';

@struct()
export class Certificate extends Struct {
  @opaque()
  cert_data: Buffer = Buffer.alloc(0);
}