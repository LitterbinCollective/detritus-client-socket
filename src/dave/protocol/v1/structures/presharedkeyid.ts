import { struct, Struct, uint8, uint64, opaque } from '../../../utils/base';
import { PSKType, ResumptionPSKUsage } from '../enums';

@struct()
export class PreSharedKeyID extends Struct {
  @uint8() psk_type: PSKType = PSKType.RESERVED;

  @opaque([ 'psk_type', PSKType.EXTERNAL ]) psk_id: Buffer = Buffer.alloc(0);

  @uint8([ 'psk_type', PSKType.RESUMPTION ]) usage: ResumptionPSKUsage = ResumptionPSKUsage.RESERVED;
  @opaque([ 'psk_type', PSKType.RESUMPTION ]) psk_group_id: Buffer = Buffer.alloc(0);
  @uint64([ 'psk_type', PSKType.RESUMPTION ]) psk_epoch: bigint = BigInt(0);

  @opaque() psk_nonce: Buffer = Buffer.alloc(0);
}