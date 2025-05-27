import {
  child,
  opaque,
  Struct,
  struct,
  uint16,
  uint8,
} from '../../../utils/base';
import { MediaOpCodes } from '../../../../constants';

import { MLSMessage } from './message';
import { Welcome } from './welcome';
import { ProposalOperationType } from '../enums';
import { ExternalSender } from './sender';

export class DAVEClientMessage extends Struct {
  @uint8()
  opcode: MediaOpCodes = 0;
}

export class DAVEServerMessage extends Struct {
  @uint16()
  sequence_number: number = 0;

  @uint8()
  opcode: MediaOpCodes = 0;
}

@struct()
export class DAVEMLSExternalSenderPackage extends DAVEServerMessage {
  opcode = MediaOpCodes.MLS_EXTERNAL_SENDER_PACKAGE;

  @child(ExternalSender)
  external_sender: ExternalSender = new ExternalSender();
}

@struct()
export class DAVEMLSKeyPackage extends DAVEClientMessage {
  opcode = MediaOpCodes.MLS_KEY_PACKAGE;

  @child(MLSMessage)
  key_package_message: MLSMessage = new MLSMessage();
}

@struct()
export class DAVEMLSProposals extends DAVEServerMessage {
  opcode = MediaOpCodes.MLS_PROPOSALS;

  @uint8() operation_type: ProposalOperationType = ProposalOperationType.APPEND;

  @child(MLSMessage, [ 'operation_type', ProposalOperationType.APPEND ], true)
  proposal_messages: MLSMessage[] = [];

  @opaque([ 'operation_type', ProposalOperationType.REVOKE ], true)
  proposal_refs: Buffer[] = [];
}

@struct()
export class DAVEMLSCommitWelcome extends DAVEClientMessage {
  opcode = MediaOpCodes.MLS_COMMIT_WELCOME;

  @child(MLSMessage)
  commit_message: MLSMessage = new MLSMessage();

  @child(Welcome)
  welcome?: Welcome;
}

@struct()
export class DAVEMLSAnnounceCommitTransition extends DAVEServerMessage {
  opcode = MediaOpCodes.MLS_PREPARE_COMMIT_TRANSITION;

  @uint16()
  transition_id: number = 0;

  @child(MLSMessage)
  commit_message: MLSMessage = new MLSMessage();
}

@struct()
export class DAVEMLSWelcome extends DAVEServerMessage {
  opcode = MediaOpCodes.MLS_WELCOME;

  @uint16()
  transition_id: number = 0;

  @child(Welcome)
  welcome: Welcome = new Welcome();
}