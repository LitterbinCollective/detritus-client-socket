import {
  Struct,
  struct,
  uint16,
  condition,
  opaque,
  child,
} from '../../../utils/base';
import { ExtensionType } from '../enums';

import { ExternalSender } from './sender';

@struct()
export class Extension extends Struct {
  @uint16() extension_type: ExtensionType = ExtensionType.RESERVED;

  @condition([
    [ 'extension_type', ExtensionType.EXTERNAL_SENDERS, child(ExternalSender, undefined, true) ],
    opaque(),
  ])
  extension_data!: any;
}