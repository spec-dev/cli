// Integer Types
export const INT = 'int'
export const SMALLINT = 'smallint'
export const INTEGER = 'integer'
export const BIGINT = 'bigint'
export const INT2 = 'int2'
export const INT4 = 'int4'
export const INT8 = 'int8'

// Arbitrary Precision Numbers
export const DECIMAL = 'decimal'
export const NUMERIC = 'numeric'

// Floating-Point Types
export const REAL = 'real'
export const DOUBLE_PRECISION = 'double precision'
export const FLOAT4 = 'float4'
export const FLOAT8 = 'float8'

// Serial Types
export const SMALLSERIAL = 'smallserial'
export const SERIAL = 'serial'
export const BIGSERIAL = 'bigserial'
export const SERIAL2 = 'serial2'
export const SERIAL4 = 'serial4'
export const SERIAL8 = 'serial8'

// Boolean Type
export const BOOL = 'bool'
export const BOOLEAN = 'boolean'

// Character Types
export const CHAR = 'char'
export const CHARACTER = 'character'
export const VARCHAR = 'varchar'
export const CHARACTER_VARYING = 'character varying'
export const TEXT = 'text'

// JSON Types
export const JSON = 'json'
export const JSONB = 'jsonb'

// Date/Time Types
export const DATE = 'date'
export const TIME = 'time'
export const TIME_WITHOUT_TIME_ZONE = 'time without time zone'
export const TIME_WITH_TIME_ZONE = 'time with time zone'
export const TIMETZ = 'timetz'
export const TIMESTAMP = 'timestamp'
export const TIMESTAMP_WITHOUT_TIME_ZONE = 'timestamp without time zone'
export const TIMESTAMP_WITH_TIME_ZONE = 'timestamp with time zone'
export const TIMESTAMPTZ = 'timestamptz'

export function narrowColType(t: string): string {
    t = t || ''

    // int2
    if ([SMALLINT, INT2].includes(t)) {
        return INT2
    }
    // int4
    if ([INTEGER, INT, INT4].includes(t)) {
        return INT4
    }
    // int8
    if ([BIGINT, INT8].includes(t)) {
        return INT8
    }
    // numeric
    if (!!t.match(new RegExp(`(${NUMERIC}|${DECIMAL})`, 'gi'))) {
        return NUMERIC
    }
    // float4
    if (!!t.match(new RegExp(`(${REAL}|${FLOAT4})`, 'gi'))) {
        return FLOAT4
    }
    // float8
    if (!!t.match(new RegExp(`(${DOUBLE_PRECISION}|${FLOAT8})`, 'gi'))) {
        return FLOAT8
    }
    // boolean
    if ([BOOL, BOOLEAN].includes(t)) {
        return BOOLEAN
    }
    // varchar
    if (!!t.match(new RegExp(`(${CHARACTER_VARYING}|${VARCHAR})`, 'gi'))) {
        return VARCHAR
    }
    // char
    if (!!t.match(new RegExp(`(${CHARACTER}|${CHAR})`, 'gi'))) {
        return CHAR
    }
    // text
    if (t === TEXT) {
        return TEXT
    }
    // json
    if (t === JSON) {
        return JSON
    }
    // jsonb
    if (t === JSONB) {
        return JSONB
    }
    // date
    if (t === DATE) {
        return DATE
    }
    // timestamptz
    if (!!t.match(new RegExp(`(${TIMESTAMP_WITH_TIME_ZONE}|${TIMESTAMPTZ})`, 'gi'))) {
        return TIMESTAMPTZ
    }
    // timestamp
    if (!!t.match(new RegExp(`(${TIMESTAMP_WITHOUT_TIME_ZONE}|${TIMESTAMP})`, 'gi'))) {
        return TIMESTAMP
    }
    // timetz
    if (!!t.match(new RegExp(`(${TIME_WITH_TIME_ZONE}|${TIMETZ})`, 'gi'))) {
        return TIMETZ
    }
    // time
    if (!!t.match(new RegExp(`(${TIME_WITHOUT_TIME_ZONE}|${TIME})`, 'gi'))) {
        return TIME
    }
    // Anything else
    return t
}
