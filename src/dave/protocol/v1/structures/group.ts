import {
  struct,
  Struct,
  uint16,
  opaque,
  uint64,
  uint32,
  child,
  optional,
} from '../../../utils/base';
import { ProtocolVersion, CipherSuite } from '../enums';

import { Extension } from './extension';
import { HPKECiphertext } from './hpkeciphertext';
import { PreSharedKeyID } from './presharedkeyid';

@struct()
export class GroupContext extends Struct {
  @uint16() version: ProtocolVersion = ProtocolVersion.RESERVED;
  @uint16() cipher_suite: CipherSuite = CipherSuite.RESERVED;
  @opaque() group_id: Buffer = Buffer.alloc(0);
  @uint64() epoch: bigint = BigInt(0);
  @opaque() group_context_extension: Buffer = Buffer.alloc(0);
}

@struct()
class BaseGroupInfo extends Struct {
  @child(GroupContext) group_context: GroupContext = new GroupContext();
  @child(Extension, undefined, true) extensions: Extension[] = [];
}

@struct()
export class GroupInfoTBS extends BaseGroupInfo {
  @opaque() confirmation_tag: Buffer = Buffer.alloc(0);
  @uint32() signer: number = 0;
}

@struct(GroupInfoTBS)
export class GroupInfo extends BaseGroupInfo {
  @uint32() signer: number = 0;
  @opaque() signature: Buffer = Buffer.alloc(0);
}

@struct()
export class PathSecret extends Struct {
  @opaque() path_secret: Buffer = Buffer.alloc(0);
}

@struct()
export class GroupSecrets extends Struct {
  @opaque() joiner_secret: Buffer = Buffer.alloc(0);
  @optional(child(PathSecret)) path_secret?: PathSecret;
  @child(PreSharedKeyID, undefined, true) psks: PreSharedKeyID[] = [];
}

@struct()
export class EncryptedGroupSecrets extends Struct {
  @opaque() new_member: Buffer = Buffer.alloc(0);
  @child(HPKECiphertext) encrypted_group_secrets: HPKECiphertext = new HPKECiphertext();
}