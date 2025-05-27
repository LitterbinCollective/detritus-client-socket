import { child, opaque, uint16, struct, Struct } from '../../../utils/base';
import { ProtocolVersion, CipherSuite } from '../enums';

import { Extension } from './extension';
import { LeafNode } from './leafnode';

class BaseKeyPackage extends Struct {
  @uint16() version: ProtocolVersion = ProtocolVersion.RESERVED;
  @uint16() cipher_suite: CipherSuite = CipherSuite.RESERVED;
  @opaque() init_key: Buffer = Buffer.alloc(0);
  @child(LeafNode) leaf_node: LeafNode = new LeafNode();
  @child(Extension, undefined, true) extensions: Extension[] = [];
}

@struct()
export class KeyPackageTBS extends BaseKeyPackage {}

@struct(KeyPackageTBS)
export class KeyPackage extends BaseKeyPackage {
  @opaque() signature: Buffer = Buffer.alloc(0);
}