import { struct, Struct, opaque, uint16 } from '../../../utils/base';

@struct()
export class SignContent extends Struct {
  @opaque() label: Buffer = Buffer.alloc(0);
  @opaque() content: Buffer = Buffer.alloc(0);
}

@struct()
export class KDFLabel extends Struct {
  @uint16() length: number = 0;
  @opaque() label: Buffer = Buffer.alloc(0);
  @opaque() context: Buffer = Buffer.alloc(0);
}