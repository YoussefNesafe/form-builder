/**
 * Sentinel select-item value meaning "cleared / unset". Radix `Select` forbids
 * an item value of `""`, so control editors that offer a "None"/"Default" row
 * use this instead and translate it back to `undefined` in `onChange`.
 */
export const NONE_VALUE = "__none__";

/**
 * Sentinel cmdk item value for a dedicated "Clear" action row inside a
 * `Command` list (single-select country picker). Distinct from `NONE_VALUE`:
 * this identifies an action item in a command palette, not a Radix `Select`
 * value standing in for "unset".
 */
export const CLEAR_VALUE = "__clear__";
