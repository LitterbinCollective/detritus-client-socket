import { BufferWalker, BufferWriter } from './bufferwalk';

export enum FieldType {
  UINT8 = 0,
  UINT16 = 1,
  UINT32 = 2,
  UINT64 = 3,
  OPAQUE = 4,
  STRUCT = 5,
  SWITCH = 6,
  OPTIONAL = 7,
}

export type Conditions<T = Field> = ([string, number | number[], T] | T)[];

export interface BaseField {
  type: FieldType;
  name: string;
  array?: boolean;
}

export interface AnyField extends BaseField {
  type: FieldType.UINT8 | FieldType.UINT16 | FieldType.UINT32 | FieldType.UINT64 | FieldType.OPAQUE;
}

export interface StructField extends BaseField {
  type: FieldType.STRUCT;
  ctor: any;
}

export interface SwitchField extends BaseField {
  type: FieldType.SWITCH;
  conditions: Conditions;
}

export interface OptionalField extends BaseField {
  type: FieldType.OPTIONAL;
  value: Field;
}

export type Field = StructField | SwitchField | OptionalField | AnyField;

class Type {
  public ctor: any;
  public fields: Field[] = [];

  public encode(instance: any) {
    if (!this.ctor)
      throw new Error('ctor is not set');

    const writer = new BufferWriter();

    for (let field of this.fields) {
      let value = instance[field.name];
      if (value === undefined) continue;

      if (field.type === FieldType.SWITCH && field.conditions) {
        let type: any;

        for (const condition of field.conditions) {
          if (!Array.isArray(condition)) {
            type = condition;
            break;
          }

          const [key, expected, field] = condition;
          if (Array.isArray(expected)) {
            if (expected.includes(instance[key])) {
              type = field;
              break;
            }
          } else if (instance[key] === expected) {
            type = field;
            break;
          }
        }

        if (!type) continue;
        field = type;
      }

      if (field.type === FieldType.OPTIONAL) {
        if (value === undefined) {
          writer.writeUInt8(0);
        } else {
          writer.writeUInt8(1);
          value = field.value;
        }
      }

      switch (field.type) {
        case FieldType.UINT8: {
          if (Array.isArray(value) || field.array) {
            writer.writeVarint(value.length);

            for (let i = 0; i < value.length; i++)
              writer.writeUInt8(value[i]);
          } else
            writer.writeUInt8(value);
        }; break;

        case FieldType.UINT16: {
          if (Array.isArray(value) || field.array) {
            writer.writeVarint(value.length * 2);

            for (let i = 0; i < value.length; i++)
              writer.writeUInt16(value[i]);
          } else
            writer.writeUInt16(value);
        }; break;

        case FieldType.UINT32: {
          if (Array.isArray(value) || field.array) {
            writer.writeVarint(value.length * 4);

            for (let i = 0; i < value.length; i++)
              writer.writeUInt32(value[i]);
          } else
            writer.writeUInt32(value);
        }; break;

        case FieldType.UINT64: {
          if (Array.isArray(value) || field.array) {
            writer.writeVarint(value.length * 8);

            for (let i = 0; i < value.length; i++)
              writer.writeUInt64(value[i]);
          } else
            writer.writeUInt64(value);
        }; break;

        case FieldType.OPAQUE: {
          if (Array.isArray(value)) {
            const writer = new BufferWriter();

            for (let i = 0; i < value.length; i++) {
              writer.writeVarint(value[i].length);
              writer.writeBuffer(value[i]);
            }

            value = writer.buffer;
          }

          writer.writeVarint(value.length);
          writer.writeBuffer(value);
        }; break;

        case FieldType.STRUCT: {
          if (Array.isArray(value)) {
            const buf: Buffer[] = [];
            for (let i = 0; i < value.length; i++)
              buf.push(value[i].encode());

            const buf2 = Buffer.concat(buf);
            writer.writeVarint(buf2.length);
            writer.writeBuffer(buf2);
          } else
            writer.writeBuffer(value.encode());
        }; break;
      }
    }

    return writer.buffer;
  }

  public decode(reader: Buffer | BufferWalker) {
    if (reader instanceof Buffer)
      reader = new BufferWalker(reader);
    const instance = new this.ctor;

    console.log(this.ctor.name, this.fields);

    for (let field of this.fields) {
      console.log('trying to read', field);

      if (field.type === FieldType.SWITCH && field.conditions) {
        let type: any;

        for (const condition of field.conditions) {
          if (!Array.isArray(condition)) {
            type = condition;
            break;
          }

          const [key, expected, field] = condition;
          if (Array.isArray(expected)) {
            if (expected.includes(instance[key])) {
              type = field;
              break;
            }
          } else if (instance[key] === expected) {
            type = field;
            break;
          }
        }

        if (!type) continue;
        field = type;
      }

      if (field.type === FieldType.OPTIONAL) {
        if (reader.readUInt8() === 0)
          continue;
        else
          field = field.value;
      }

      let value;

      switch (field.type) {
        case FieldType.UINT8: {
          if (field.array) {
            const len = reader.readVarint();
            const items = [];
            for (let i = 0; i < len; i++)
              items.push(reader.readUInt8());
            value = items;
          } else
            value = reader.readUInt8();
        } break;

        case FieldType.UINT16: {
          if (field.array) {
            const len = reader.readVarint();
            const items = [];
            for (let i = 0; i < len; i++)
              items.push(reader.readUInt16());
            value = items;
          } else
            value = reader.readUInt16();
        } break;

        case FieldType.UINT32: {
          if (field.array) {
            const len = reader.readVarint();
            const items = [];
            for (let i = 0; i < len; i++)
              items.push(reader.readUInt32());
            value = items;
          } else
            value = reader.readUInt32();
        } break;

        case FieldType.UINT64: {
          if (field.array) {
            const len = reader.readVarint();
            const items = [];
            for (let i = 0; i < len; i++)
              items.push(reader.readUInt64());
            value = items;
          } else
            value = reader.readUInt64();
        } break;

        case FieldType.OPAQUE: {
          const len = reader.readVarint();

          if (field.array) {
            const items = [];
            for (let i = 0; i < len; i++) {
              const itemLen = reader.readVarint();
              const item = reader.readBuffer(itemLen);
              items.push(item);
            }
            value = items;
          } else
            value = reader.readBuffer(len);
        } break;

        case FieldType.STRUCT: {
          const childCtor = field.ctor ?? instance[field.name]?.constructor;

          if (field.array) {
            const vectorLen = reader.readVarint();
            const vectorEnd = reader.offset + vectorLen;

            const items = [];
            while (reader.offset < vectorEnd) {
              const item = childCtor.decode(reader);
              items.push(item);
            }

            value = items;
          } else
            value = childCtor.decode(reader);
        } break;
        default:
          throw new Error(`unknown field type: ${field.type}`);
      }

      instance[field.name] = value;
    }

    return instance;
  }

  public copy(source: any, target: any) {
    const forbidden = [ 'function', 'symbol' ];

    for (const field of this.fields) {
      const val = source[field.name];
      const type = typeof val;
      if (val === undefined || forbidden.includes(type)) continue;

      if (type === 'object' && target[field.name] instanceof Struct)
        target[field.name].copy(val);
      else
        target[field.name] = val;
    }
  }
}

export class Struct {
  public static _msg?: any;
  public static _tbs?: new () => Struct;

  private get _msg(): any {
    return (this.constructor as any)._msg;
  }

  private get _tbs(): new () => Struct {
    return (this.constructor as any)._tbs;
  }

  public createTBS(object?: any) {
    if (!this._tbs) throw new Error('createTBS must be called on a TBS struct');
    const tbs = object ? (this._tbs as any).fromObject(object) : new this._tbs();
    tbs.copy(this);
    return tbs.encode();
  }

  public encode(): Buffer {
    if (!this._msg) throw new Error('_msg is not set');
    return this._msg.encode(this);
  }

  public copy(obj: any): void {
    if (!this._msg) throw new Error('_msg is not set');
    this._msg.copy(obj, this);
  }

  public static decode<T extends typeof Struct>(this: T, reader: Buffer | BufferWalker): InstanceType<T> {
    if (!this._msg) throw new Error('_msg is not set');
    return this._msg.decode(reader) as InstanceType<T>;
  }

  public static fromObject<T extends typeof Struct>(this: T, obj: any): InstanceType<T> {
    const instance = new this() as InstanceType<T>;
    instance.copy(obj);
    return instance;
  }
}

function get(target: any) {
  const ctor = typeof target === 'function' ? target : target.constructor;

  if (!Object.prototype.hasOwnProperty.call(ctor, '_msg')) {
    const type = new Type();
    type.ctor = ctor;

    const parent = Object.getPrototypeOf(ctor);
    if (parent?._msg instanceof Type)
      type.fields = [...parent._msg.fields];

    ctor._msg = type;
  }

  return ctor;
}

export function struct(tbs?: new () => Struct) {
  return function (target: any) {
    const struct = get(target);
    struct._tbs = tbs;
  };
}

function switchOrPlain(field: Field, condition?: [string, number | number[]]) {
  if (condition)
    return{
      type: FieldType.SWITCH,
      name: field.name,
      conditions: [ [ ...condition, field ] ],
    };

  return field;
}

export function uint8(condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.UINT8, array, name }, condition));
  };
}

export function uint16(condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.UINT16, array, name }, condition));
  };
}

export function uint32(condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.UINT32, array, name }, condition));
  };
}

export function uint64(condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.UINT64, array, name }, condition));
  };
}

export function opaque(condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.OPAQUE, array, name }, condition));
  };
}

export function child(ctor: any, condition?: [string, number | number[]], array?: boolean) {
  return function (target: any, name: string) {
    get(target)._msg.fields.push(switchOrPlain({ type: FieldType.STRUCT, array, name, ctor }, condition));
  };
}

type ProbablyField = Field | ((target: any, name: string) => void);

function resolveField(input: ProbablyField, target: any, name: string) {
  if (typeof input === 'function') {
    input(target, name);

    const fields = get(target)._msg.fields;
    const field = fields.pop();
    return field;
  }

  return input;
}

export function condition(conditions: Conditions<ProbablyField>) {
  return function (target: any, name: string) {
    conditions = conditions.map(c => {
      if (Array.isArray(c)) {
        const field = resolveField(c[2], target, name);
        field.name = name;
        return field;
      }

      const field = resolveField(c, target, name);
      field.name = name;
      return field;
    }) as Conditions<Field>;

    get(target)._msg.fields.push({ type: FieldType.SWITCH, name, conditions });
  };
}

export function optional(field: ProbablyField) {
  return function (target: any, name: string) {
    const field2 = resolveField(field, target, name);
    get(target)._msg.fields.push({ type: FieldType.OPTIONAL, name, value: field2 });
  };
}
