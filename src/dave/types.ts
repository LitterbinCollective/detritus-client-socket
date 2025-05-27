export interface Transition {
  epoch: bigint;
}

export interface KeyPair<T = Uint8Array> {
  publicKey: T;
  privateKey: T;
}

export interface PacketResponse {
  seq?: number;
  response?: Buffer | string;
}