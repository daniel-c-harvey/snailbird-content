// export type Include<T extends Record<PropertyKey, PropertyKey>, U> = T extends U ? T : never;

// export type Reverse<T extends Record<PropertyKey, PropertyKey>> = {
//     [P in T[keyof T]] : keyof T // filter for orignal keys for the values
// }

// export function reverse<T extends Record<PropertyKey, PropertyKey>>(value : T) : Reverse<T> {
//     return Object.entries(value).map(([key, value]) => [value, key]) as Reverse<T>;
// }

export function reverse<TKey extends PropertyKey, TValue extends PropertyKey>(value : Record<TKey, TValue>) : Record<TValue, TKey> {
    return Object.entries(value).map(([key, value]) => [value, key]) as Record<TValue, TKey>;
}