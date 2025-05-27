import v1 from './protocol/v1';

export const MAX_DAVE_PROTOCOL_VERSION = 1;

const versions = Object.freeze({
  [1]: v1
});

export function createDAVE(version: number) {
  if (version === 0)
    return null;

  if (version < 1 || version > MAX_DAVE_PROTOCOL_VERSION || !(version in versions))
    throw new Error(`Unsupported DAVE protocol version: ${version}`);

  return new versions[version as keyof typeof versions]();
}

export { AbstractDAVEManager } from './abstract';
