import {
  struct,
  Struct,
  uint16,
  uint32,
  opaque,
  child,
  uint8,
} from '../../../utils/base';
import {
  CipherSuite,
  ProposalOrRefType,
  ProposalType,
  ProtocolVersion,
} from '../enums';

import { Extension } from './extension';
import { KeyPackage } from './keypackage';
import { LeafNode } from './leafnode';
import { PreSharedKeyID } from './presharedkeyid';

@struct()
export class Proposal extends Struct {
  @uint16() proposal_type: ProposalType = ProposalType.RESERVED;

  @child(KeyPackage, [ 'proposal_type', ProposalType.ADD ])
  key_package: KeyPackage = new KeyPackage();

  @child(LeafNode, [ 'proposal_type', ProposalType.UPDATE ])
  leaf_node: LeafNode = new LeafNode();

  @uint32([ 'proposal_type', ProposalType.REMOVE ])
  removed: number = 0;

  @child(PreSharedKeyID, [ 'proposal_type', ProposalType.PSK ])
  psk: PreSharedKeyID = new PreSharedKeyID();

  @opaque([ 'proposal_type', ProposalType.REINIT ])
  group_id: Buffer = Buffer.alloc(0);

  @uint16([ 'proposal_type', ProposalType.REINIT ])
  version: ProtocolVersion = ProtocolVersion.RESERVED;

  @uint16([ 'proposal_type', ProposalType.REINIT ])
  cipher_suite: CipherSuite = CipherSuite.RESERVED;

  @child(Extension, [ 'proposal_type', [ ProposalType.REINIT, ProposalType.GROUP_CONTEXT_EXTENSIONS ] ], true)
  extensions: Extension[] = [];

  @opaque([ 'proposal_type', ProposalType.EXTERNAL_INIT ])
  kem_output: Buffer = Buffer.alloc(0);
}

@struct()
export class ProposalOrRef extends Struct {
  @uint8() type: ProposalOrRefType = ProposalOrRefType.RESERVED;

  @child(Proposal, [ 'type', ProposalOrRefType.PROPOSAL ])
  proposal: Proposal = new Proposal();

  @opaque([ 'type', ProposalOrRefType.REFERENCE ])
  reference: Buffer = Buffer.alloc(0);
}