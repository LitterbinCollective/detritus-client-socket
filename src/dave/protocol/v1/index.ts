import { Aes128Gcm, CipherSuite, DhkemP256HkdfSha256, HkdfSha256 } from '@hpke/core';
import { p256 } from '@noble/curves/p256';
import { EventSpewer } from 'detritus-utils';

import {
  DAVEMLSAnnounceCommitTransition,
  DAVEMLSCommitWelcome,
  DAVEMLSExternalSenderPackage,
  DAVEMLSKeyPackage,
  DAVEMLSProposals,
  DAVEMLSWelcome,
  ExternalSender,
  KDFLabel,
  KeyPackage,
  LeafNode,
  Lifetime,
  SignContent,
} from './structures/index';
import {
  ProposalOperationType,
  WireFormats,
  CipherSuite as CipherSuiteEnum,
  ProtocolVersion,
  LeafNodeSource,
  CredentialType,
} from './enums';
import { Struct } from '../../utils/base';
import { MediaOpCodes } from '../../../constants';
import { KeyPair, Transition, PacketResponse } from '../../types';
import { AbstractDAVEManager } from '../../abstract';

const FLAG_INVALID_MESSAGES = false;

export default class DAVEv1 extends EventSpewer implements AbstractDAVEManager {
  private cipherSuite?: CipherSuite
  private epoch: bigint = BigInt(0);
  private externalSender?: ExternalSender;
  private transitions: Record<number, Transition> = {};
  private members = [];

  private cryptoSuite = new CipherSuite({
    kem: new DhkemP256HkdfSha256(),
    kdf: new HkdfSha256(),
    aead: new Aes128Gcm(),
  });
  private hpkeKeyPair!: KeyPair<CryptoKey>;
  private signatureKeyPair!: KeyPair;

  private async generateKeyPairs() {
    const keyPair = await this.cryptoSuite.kem.generateKeyPair();

    this.hpkeKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };

    const priv = p256.utils.randomPrivateKey();
    const pub = p256.getPublicKey(priv);

    this.signatureKeyPair = {
      publicKey: pub,
      privateKey: priv,
    };
  }

  public async getKeyPackage(who: string) {
    await this.generateKeyPairs();

    const lifetime = Lifetime.max();
    const publicKey = Buffer.from(await this.cryptoSuite.kem.serializePublicKey(this.hpkeKeyPair.publicKey));

    const leafNode = new LeafNode();
    leafNode.leaf_node_source = LeafNodeSource.KEY_PACKAGE;
    leafNode.lifetime = lifetime;
    leafNode.signature_key = Buffer.from(this.signatureKeyPair.publicKey);
    leafNode.encryption_key = publicKey;
    leafNode.capabilities.cipher_suite = [ CipherSuiteEnum.MLS_128_DHKEMP256_AES128GCM_SHA256_P256 ];
    leafNode.credential.credential_type = CredentialType.BASIC;
    leafNode.credential.identity = Buffer.alloc(8);
    leafNode.credential.identity.writeBigUint64BE(BigInt(who));
    leafNode.signature = this.signWithLabel('LeafNodeTBS', leafNode.createTBS());

    const keyPackage = new KeyPackage();
    keyPackage.version = ProtocolVersion.MLS_10;
    keyPackage.cipher_suite = CipherSuiteEnum.MLS_128_DHKEMP256_AES128GCM_SHA256_P256;
    keyPackage.leaf_node = leafNode;
    keyPackage.init_key = publicKey;
    keyPackage.signature = this.signWithLabel('KeyPackageTBS', keyPackage.createTBS());

    const message = new DAVEMLSKeyPackage();
    message.key_package_message.wire_format = WireFormats.MLS_KEY_PACKAGE;
    message.key_package_message.key_package = keyPackage;

    return message.encode();
  }

  private json(message: Buffer): PacketResponse | false {
    try {
      const json = JSON.parse(message.toString('utf-8'));

      switch (json.op) {
        case MediaOpCodes.SECURE_FRAMES_PREPARE_PROTOCOL_TRANSITION: {
          console.log(json);
          return { seq: json.seq };
        }

        case MediaOpCodes.SECURE_FRAMES_EXECUTE_TRANSITION: {
          console.log(json);
          return { seq: json.seq };
        }

        case MediaOpCodes.SECURE_FRAMES_PREPARE_EPOCH: {
          console.log(json);
          return { seq: json.seq };
        }

        case MediaOpCodes.MLS_PREPARE_COMMIT_TRANSITION: {
          console.log(json);
          return { seq: json.seq };
        }
      }
    } catch (err) {}

    return false;
  }

  public packet(message: Buffer): PacketResponse | false {
    const response = this.json(message);
    if (response)
      return response;

    const opcode = message.readUInt8(2);

    switch (opcode) {
      case MediaOpCodes.MLS_EXTERNAL_SENDER_PACKAGE: {
        const struct = DAVEMLSExternalSenderPackage.decode(message);

        this.setExternalSender(struct);
        return { seq: struct.sequence_number };
      }

      case MediaOpCodes.MLS_PROPOSALS: {
        const struct = DAVEMLSProposals.decode(message);

        this.processProposal(struct);
        return { seq: struct.sequence_number };
      }
    }

    try {
      switch (opcode) {
        case MediaOpCodes.MLS_PREPARE_COMMIT_TRANSITION: {
          const struct = DAVEMLSAnnounceCommitTransition.decode(message);

          this.processCommit(struct);
          return { seq: struct.sequence_number };
        }

        case MediaOpCodes.MLS_WELCOME: {
          const struct = DAVEMLSWelcome.decode(message);

          this.processWelcome(struct);
          return { seq: struct.sequence_number };
        }
      }
    } catch (err) {
      console.log(err);

      let transitionId: number | undefined;
      if (FLAG_INVALID_MESSAGES && transitionId) {
        return {
          response: JSON.stringify({
            op: MediaOpCodes.MLS_INVALID_COMMIT_WELCOME,
            d: { transition_id: transitionId }
          })
        };
      }
    }

    return false;
  }

  private signWithLabel(label: string, content: Buffer | Struct) {
    if (content instanceof Struct)
      content = content.encode() as Buffer;

    const signContent = new SignContent();
    signContent.label = Buffer.from('MLS 1.0 ' + label);
    signContent.content = content;

    const signature = p256.sign(signContent.encode(), this.signatureKeyPair.privateKey);

    return Buffer.from(signature.toDERRawBytes());
  }

  private async expandWithLabel(secret: Buffer, label: string, context: Buffer, length: number = 32) {
    const kdfLabel = new KDFLabel();
    kdfLabel.label = Buffer.from('MLS 1.0 ' + label);
    kdfLabel.context = context;
    kdfLabel.length = length;

    const salt = new ArrayBuffer(length);
    const serialized = (new Uint8Array(kdfLabel.encode())).buffer;
    const prk = await this.cryptoSuite.kdf.extract(salt, (new Uint8Array(secret)).buffer);
    const okm = await this.cryptoSuite.kdf.expand(prk, serialized, length);

    return Buffer.from(okm);
  }

  private deriveSecret(secret: Buffer, label: string) {
    return this.expandWithLabel(secret, label, Buffer.alloc(0));
  }

  public setExternalSender(sender: DAVEMLSExternalSenderPackage) {
    console.log(sender);
    this.externalSender = sender.external_sender;
  }

  public processProposal(proposal: DAVEMLSProposals) {
    console.log(proposal);

    if (proposal.operation_type === ProposalOperationType.APPEND) {

    } else if (proposal.operation_type === ProposalOperationType.REVOKE) {

    }
  }

  public processCommit(commit: DAVEMLSAnnounceCommitTransition) {
    console.log(commit);
  }

  public processWelcome(welcome: DAVEMLSWelcome) {
    console.log(welcome);
  }
}