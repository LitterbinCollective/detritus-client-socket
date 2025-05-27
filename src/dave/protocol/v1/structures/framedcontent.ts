import { opaque, uint64, uint8, struct, Struct, child, uint16, StructField } from '../../../utils/base';
import { ContentType, ProtocolVersion, WireFormats } from '../enums';

import { GroupContext } from './group';
import { Commit } from './commit';
import { Proposal } from './proposal';
import { Sender } from './sender';

@struct()
export class FramedContentTBS extends Struct {
  @uint16()
  version: ProtocolVersion = ProtocolVersion.RESERVED;

  @uint16()
  wire_format: WireFormats = WireFormats.RESERVED;

  @child(undefined)
  content: FramedContent = new FramedContent();

  @child(GroupContext)
  context?: GroupContext;
}

@struct(FramedContentTBS)
export class FramedContent extends Struct {
  @opaque()
  group_id: Buffer = Buffer.alloc(0);

  @uint64()
  epoch: bigint = BigInt(0);

  @child(Sender)
  sender: Sender = new Sender();

  @opaque()
  authenticated_data: Buffer = Buffer.alloc(0);

  @uint8()
  content_type: ContentType = ContentType.RESERVED;

  @opaque([ 'content_type', ContentType.APPLICATION ])
  application_data: Buffer = Buffer.alloc(0);

  @child(Proposal, [ 'content_type', ContentType.PROPOSAL ])
  proposal: Proposal = new Proposal();

  @child(Commit, [ 'content_type', ContentType.COMMIT ])
  commit: Commit = new Commit();
}

if (FramedContentTBS._msg)
  (FramedContentTBS._msg.fields[2] as StructField).ctor = FramedContent;

@struct()
export class FramedContentAuthData extends Struct {
  @opaque()
  signature: Buffer = Buffer.alloc(0);

  @opaque()
  mac?: Buffer;
}