import { struct, Struct, child, opaque, uint16 } from '../../../utils/base';
import { CipherSuite } from '../enums';

import { EncryptedGroupSecrets } from './group';

@struct()
export class Welcome extends Struct {
  @uint16() cipher_suite: CipherSuite = CipherSuite.RESERVED;
  @child(EncryptedGroupSecrets, undefined, true) secrets: EncryptedGroupSecrets[] = [];
  @opaque() group_info: Buffer = Buffer.alloc(0);
}