export class BufferWalker {
  public offset: number = 0;
  private buffer: Buffer;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  public readUInt8(): number {
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  public readUInt16(): number {
    const value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  public readUInt32(): number {
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  public readUInt64(): bigint {
    const value = this.buffer.readBigUInt64BE(this.offset);
    this.offset += 8;
    return value;
  }

  public readString(): string {
    const length = this.readUInt16();
    const value = this.buffer.toString('utf-8', this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  public readBuffer(length: number): Buffer {
    const value = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  public readVarint() {
    let byte = this.readUInt8();

    const prefix = byte >> 6;
    if (prefix === 3)
      throw new Error('invalid variable length integer prefix');

    const length = 1 << prefix;

    byte = byte & 0x3f;
    for (let i = 0; i < (length - 1); i++)
      byte = (byte << 8) + this.readUInt8();

    if (prefix >= 1 && byte < (1 << (8 * (length / 2) - 2 )))
      throw new Error('minimum encoding was not used');

    return byte;
  }

  public readVector(): Buffer {
    const length = this.readVarint();
    return this.readBuffer(length);
  }
}

export class BufferWriter {
  public buffer: Buffer;
  private offset: number = 0;

  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  public writeUInt8(value: number): void {
    this.buffer = Buffer.concat([this.buffer, Buffer.from([value])]);
    this.offset += 1;
  }

  public writeUInt16(value: number): void {
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(value);
    this.buffer = Buffer.concat([this.buffer, buf]);
    this.offset += 2;
  }

  public writeUInt32(value: number): void {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(value);
    this.buffer = Buffer.concat([this.buffer, buf]);
    this.offset += 4;
  }

  public writeUInt64(value: bigint): void {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(value);
    this.buffer = Buffer.concat([this.buffer, buf]);
    this.offset += 8;
  }

  public writeBuffer(value: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, value]);
    this.offset += value.length;
  }

  public writeVarint(value: number): void {
    let length: number;
    if (value < (1 << 6))
      length = 1;
    else if (value < (1 << 14))
      length = 2;
    else if (value < (1 << 30))
      length = 4;
    else
      throw new Error('value too large to encode as varint');

    const prefix = Math.log2(length);
    const bytes: number[] = [];

    for (let i = 0; i < length - 1; i++) {
      bytes.unshift(value & 0xFF);
      value >>= 8;
    }

    const firstByte = ((prefix << 6) | (value & 0x3F)) & 0xFF;
    bytes.unshift(firstByte);

    for (const b of bytes)
      this.writeUInt8(b);
  }

  public writeVector(value: Buffer): void {
    this.writeVarint(value.length);
    this.writeBuffer(value);
  }
}
