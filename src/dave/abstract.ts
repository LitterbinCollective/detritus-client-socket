import { PacketResponse } from './types';

export abstract class AbstractDAVEManager {
  abstract getKeyPackage(who: string): Promise<Buffer> | Buffer;
  abstract packet(message: Buffer): Promise<PacketResponse> | PacketResponse | false;
}