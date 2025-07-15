import { createCipheriv, createDecipheriv } from 'crypto';
import { CryptoModules, MediaEncryptionModes } from '../constants';

const PCrypto: {
  available: {[key: string]: any},
  modules: Array<CryptoModules>,
  using: CryptoModules | null,
} = {
  available: {},
  modules: [
    CryptoModules.SODIUM,
    CryptoModules.LIBSODIUM_WRAPPERS
  ],
  using: null,
};
// order in preference

(async () => {
  for (let name of PCrypto.modules) {
    try {
      const crypto = PCrypto.available[name] = require(name);
      switch (name) {
        case CryptoModules.LIBSODIUM_WRAPPERS: {
          if (crypto.ready) {
            await crypto.ready;
          }
        }; break;
      }
      break;
    } catch(error) {
      continue;
    }
  }
  PCrypto.using = PCrypto.modules.find((mod) => (mod in PCrypto.available)) || null;
})();


function Uint8ArrayToBuffer(array: Uint8Array, cache?: Buffer | null): Buffer {
  if (cache) {
    for (let i = 0; i < array.length; i++) {
      cache[i] = array[i];
    }
    return cache;
  }
  return Buffer.from(array);
}

export default {
  get using(): CryptoModules {
    if (!PCrypto.using) {
      throw new Error(`For media (video/voice) packing/unpacking, please install one of: ${JSON.stringify(PCrypto.modules)}`);
    }
    return PCrypto.using;
  },
  get module(): any {
    const crypto = PCrypto.available[this.using];
    switch (this.using) {
      case CryptoModules.SODIUM: {
        return crypto.api;
      };
    }
    return crypto;
  },
  generateNonce(cache?: Buffer | null): Buffer {
    const crypto = this.module;

    let nonce: Buffer;
    switch (this.using) {
      case CryptoModules.LIBSODIUM_WRAPPERS: {
        const generated: Uint8Array = crypto.randombytes_buf(crypto.crypto_secretbox_NONCEBYTES);
        nonce = Uint8ArrayToBuffer(generated, cache);
      }; break;
      case CryptoModules.SODIUM: {
        nonce = cache || Buffer.alloc(crypto.crypto_secretbox_NONCEBYTES);
        crypto.randombytes_buf(nonce);
      }; break;
      default: {
        throw new Error(`For media (video/voice) packing/unpacking, please install one of: ${JSON.stringify(PCrypto.modules)}`);
      };
    }
    return nonce;
  },
  encrypt(
    encryptionType: MediaEncryptionModes,
    key: Uint8Array,
    data: Buffer,
    additionalData: Buffer,
    nonce: Buffer,
    cache?: Buffer | null,
  ): {
    length: number,
    packet: Buffer,
  } {
    let length = 0;
    let packet: Buffer;

    switch (encryptionType) {
      case MediaEncryptionModes.AEAD_AES256_GCM_RTPSIZE: {
        const cipher = createCipheriv('aes-256-gcm', key, nonce);
        cipher.setAAD(additionalData);

        packet = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
        length = packet.length;
      } break;
      case MediaEncryptionModes.AEAD_XCHACHA20_POLY1305_RTPSIZE: {
        const crypto = this.module;
        switch (this.using) {
          case CryptoModules.LIBSODIUM_WRAPPERS: {
            const generated: Uint8Array = crypto.crypto_aead_xchacha20poly1305_ietf_encrypt(data, additionalData, null, nonce, key);
            packet = Uint8ArrayToBuffer(generated);
            length = packet.length;
          }; break;
          case CryptoModules.SODIUM: {
            packet = crypto.api.crypto_aead_xchacha20poly1305_ietf_encrypt(data, additionalData, null, nonce, key);
            length = packet.length;
          }; break;
        }
      }; break;
      default:
        throw new Error(`Unsupported encryption type: ${encryptionType}`);
    }

    return {length, packet};
  },
  decrypt(
    encryptionType: MediaEncryptionModes,
    key: Uint8Array,
    data: Buffer,
    additionalData: Buffer,
    nonce: Buffer,
  ): Buffer | null {
    let packet: Buffer | null = null;
    switch (encryptionType) {
      case MediaEncryptionModes.AEAD_AES256_GCM_RTPSIZE: {
        const decipher = createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAAD(additionalData);

        try {
          packet = Buffer.concat([decipher.update(data), decipher.final()]);
        } catch (error) {
          return null;
        }
      } break;
      case MediaEncryptionModes.AEAD_XCHACHA20_POLY1305_RTPSIZE: {
        const crypto = this.module;
        switch (this.using) {
          case CryptoModules.LIBSODIUM_WRAPPERS: {
            const generated: Uint8Array = crypto.crypto_aead_xchacha20poly1305_ietf_decrypt(null, data, additionalData, nonce, key);
            packet = Uint8ArrayToBuffer(generated);
          }; break;
          case CryptoModules.SODIUM: {
            packet = crypto.api.crypto_aead_xchacha20poly1305_ietf_decrypt(data, additionalData, null, nonce, key);
          }; break;
        }
      }; break;
      default:
        throw new Error(`Unsupported encryption type: ${encryptionType}`);
    }

    return packet;
  },
}
