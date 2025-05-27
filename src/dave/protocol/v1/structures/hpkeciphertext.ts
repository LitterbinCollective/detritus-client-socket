import { struct, Struct, opaque } from '../../../utils/base';

@struct()
export class HPKECiphertext extends Struct {
  @opaque() kem_output: Buffer = Buffer.alloc(0);
  @opaque() cipher_text: Buffer = Buffer.alloc(0);
}
