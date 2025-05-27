import { child, Struct, uint64, uint8, opaque, struct, uint16 } from '../../../utils/base';
import { ContentType, ProtocolVersion, WireFormats } from '../enums';

import { FramedContentAuthData, FramedContent } from './framedcontent';
import { GroupInfo } from './group';
import { KeyPackage } from './keypackage';
import { Welcome } from './welcome';

@struct()
export class PublicMessage extends Struct {
  @child(FramedContent) content: FramedContent = new FramedContent();
  @child(FramedContentAuthData) auth: FramedContentAuthData = new FramedContentAuthData();
  @opaque() membership_tag?: Buffer;
}

@struct()
export class PrivateMessage extends Struct {
  @opaque() group_id: Buffer = Buffer.alloc(0);
  @uint64() epoch: bigint = BigInt(0);
  @uint8() content_type: ContentType = ContentType.RESERVED;
  @opaque() authenticated_data: Buffer = Buffer.alloc(0);
  @opaque() encrypted_sender_data: Buffer = Buffer.alloc(0);
  @opaque() cipher_text: Buffer = Buffer.alloc(0);
}

@struct()
export class MLSMessage extends Struct {
  @uint16() version: ProtocolVersion = ProtocolVersion.RESERVED;
  @uint16() wire_format: WireFormats = WireFormats.RESERVED;

  @child(PublicMessage, [ 'wire_format', WireFormats.MLS_PUBLIC_MESSAGE ])
  public_message?: PublicMessage;

  @child(PrivateMessage, [ 'wire_format', WireFormats.MLS_PRIVATE_MESSAGE ])
  private_message?: PrivateMessage;

  @child(Welcome, [ 'wire_format', WireFormats.MLS_WELCOME ])
  welcome?: Welcome;

  @child(GroupInfo, [ 'wire_format', WireFormats.MLS_GROUP_INFO ])
  group_info?: GroupInfo;

  @child(KeyPackage, [ 'wire_format', WireFormats.MLS_KEY_PACKAGE ])
  key_package?: KeyPackage;
}