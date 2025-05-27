import { struct, uint16, opaque, child, Struct } from '../../../utils/base';

import { CredentialType } from '../enums';
import { Certificate } from './certificate';

@struct()
export class Credential extends Struct {
  @uint16()
  credential_type: CredentialType = CredentialType.RESERVED;

  @opaque([ 'credential_type', CredentialType.BASIC ])
  identity: Buffer = Buffer.alloc(0);

  @child(Certificate, [ 'credential_type', CredentialType.X509 ])
  certificates: Certificate[] = [];
}