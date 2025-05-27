import {
  struct,
  Struct,
  uint8,
  opaque,
  child,
  uint32
} from '../../../utils/base';
import { LeafNodeSource } from '../enums';

import { Capabilities } from './capabilities';
import { Credential } from './credential';
import { Lifetime } from './lifetime';
import { Extension } from './extension';

class BaseLeafNode extends Struct {
  @opaque() encryption_key: Buffer = Buffer.alloc(0);
  @opaque() signature_key: Buffer = Buffer.alloc(0);
  @child(Credential) credential: Credential = new Credential();
  @child(Capabilities) capabilities: Capabilities = new Capabilities();
  @uint8() leaf_node_source: LeafNodeSource = LeafNodeSource.RESERVED;

  @child(Lifetime, [ 'leaf_node_source', LeafNodeSource.KEY_PACKAGE ])
  lifetime?: Lifetime;

  @opaque([ 'leaf_node_source', LeafNodeSource.COMMIT ])
  parent_hash: Buffer = Buffer.alloc(0);

  @child(Extension, undefined, true) extensions: Extension[] = [];
}

@struct()
export class LeafNodeTBS extends BaseLeafNode {
  @opaque([ 'leaf_node_source', [ LeafNodeSource.UPDATE, LeafNodeSource.COMMIT ] ])
  group_id: Buffer = Buffer.alloc(0);

  @uint32([ 'leaf_node_source', [ LeafNodeSource.UPDATE, LeafNodeSource.COMMIT ] ])
  leaf_index: number = 0;
}

@struct(LeafNodeTBS)
export class LeafNode extends BaseLeafNode {
  @opaque() signature: Buffer = Buffer.alloc(0);
}