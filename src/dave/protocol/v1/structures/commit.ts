import { struct, Struct, opaque, child, optional } from '../../../utils/base';

import { HPKECiphertext } from './hpkeciphertext';
import { LeafNode } from './leafnode';
import { ProposalOrRef } from './proposal';

@struct()
export class UpdatePathNode extends Struct {
  @opaque() encryption_key: Buffer = Buffer.alloc(0);
  @child(HPKECiphertext) encryption_path_secret: HPKECiphertext = new HPKECiphertext();
}

@struct()
export class UpdatePath extends Struct {
  @child(LeafNode) leaf_node: LeafNode = new LeafNode();
  @child(UpdatePathNode, undefined, true) nodes: UpdatePathNode[] = [];
}

@struct()
export class Commit extends Struct {
  @child(ProposalOrRef, undefined, true) proposals: ProposalOrRef[] = [];
  @optional(child(UpdatePath)) path?: UpdatePath;
}