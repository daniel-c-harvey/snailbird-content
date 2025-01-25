// export type Include<T extends Record<PropertyKey, PropertyKey>, U> = T extends U ? T : never;

import { stringify } from "node:querystring";

// export type Reverse<T extends Record<PropertyKey, PropertyKey>> = {
//     [P in T[keyof T]] : keyof T // filter for orignal keys for the values
// }

// export function reverse<T extends Record<PropertyKey, PropertyKey>>(value : T) : Reverse<T> {
//     return Object.entries(value).map(([key, value]) => [value, key]) as Reverse<T>;
// }

// export function reverse<TKey extends PropertyKey, TValue extends PropertyKey>(value : Record<TKey, TValue>) : Record<TValue, TKey> {
//     return Object.keys(value).reduce<Record<TValue, TKey>>((acc, key) => {
//         if (!(val as TValue in acc))  acc[val as TValue] = key;
//         return acc;
// }, {} as Record<TValue, TKey>) as Record<TValue, TKey>;
// }

export function reverse(value : Record<string, string>) : Record<string, string> {
    return Object.entries(value).reduce((acc, [key, val]) => {
        if(!(val in acc)) acc[val] = key;
        return acc;
    }, {} as Record<string, string>);
}