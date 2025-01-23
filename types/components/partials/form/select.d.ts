export function getSelectStyle({ name, isFocused, isSelected, hasError, usePrefixes }: {
    name: any;
    isFocused: any;
    isSelected: any;
    hasError: any;
    usePrefixes: any;
}): string;
/**
 * @param {string} name - field name or path on state (used to match errors), e.g. 'date', 'company.email'
 * @param {string} [minMenuWidth] - width of the dropdown menu
 * @param {string} [inputId] - name used if not provided
 * @param {function} [onChange] - e.g. (event) => onInputChange(event)
 * @param {object} [state] - object to get value from, and check errors against
 * @param {string} [type] - speical types: 'country', 'customer', 'customer-big'
 *
 * react-select prop quick reference (https://react-select.com/props#api):
 *   isDisabled={false}
 *   isMulti={false}
 *   isSearchable={true}
 *   options={[{ value: 'chocolate', label: 'Chocolate' }]}
 *   placeholder="Select a color"
 *   value={options.find(o => o.code == state.color)} // to clear you need to set to null, not undefined
 *   isClearable={false}
 *   menuIsOpen={false}
 */
export function Select({ inputId, minMenuWidth, name, prefix, onChange, options, state, type, ...props }: string): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=select.d.ts.map