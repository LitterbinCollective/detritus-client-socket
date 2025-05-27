import { opaque, Struct, uint8, uint32, child, struct } from '../../../utils/base';
import { SenderType } from '../enums';

import { Credential } from './credential';

@struct()
export class ExternalSender extends Struct {
  @opaque() signature_key: Buffer = Buffer.alloc(0);
  @child(Credential) credential: Credential = new Credential();
}

@struct()
export class Sender extends Struct {
  @uint8() sender_type: SenderType = SenderType.RESERVED;

  @uint32([ 'sender_type', SenderType.MEMBER ])
  leaf_index: number = 0;

  @uint32([ 'sender_type', SenderType.EXTERNAL ])
  sender_index: number = 0;
}