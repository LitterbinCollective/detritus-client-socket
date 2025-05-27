import { Struct, uint64, struct } from '../../../utils/base';

@struct()
export class Lifetime extends Struct {
  @uint64() not_before: bigint = BigInt(0);
  @uint64() not_after: bigint = BigInt(0);

  public static max() {
    const l = new Lifetime();
    l.not_before = 0n;
    l.not_after = 0xffffffffffffffffn;
    return l;
  }
}