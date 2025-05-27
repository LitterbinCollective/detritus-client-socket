import { uint16, struct, Struct } from '../../../utils/base';
import {
  ProtocolVersion,
  CipherSuite,
  CredentialType,
  ExtensionType,
  ProposalType,
} from '../enums';

@struct()
export class Capabilities extends Struct {
  @uint16(undefined, true)
  protocol_version: ProtocolVersion[] = [];

  @uint16(undefined, true)
  cipher_suite: CipherSuite[] = [];

  @uint16(undefined, true)
  extensions: ExtensionType[] = [];

  @uint16(undefined, true)
  proposals: ProposalType[] = [];

  @uint16(undefined, true)
  credentials: CredentialType[] = [];
}