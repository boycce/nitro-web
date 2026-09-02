---
name: nitro-structuring
description: For projects using nitro-web only. How to name, place and split files. Use when adding a component, deciding which file code belongs in, splitting a file that got long, or refactoring and renaming existing ones.
---

# Read the project first

  These are defaults. Before applying them, look at the folder you're working in: if its files already follow a different convention (rare), match that instead.

# Basic file order

  - third party imports
  - local imports 
  - reusable types (if applicable)
  - constants/vars
  - Main export (see nitro-page skill for component order)
  - referenced/sub components (top down)
  - page routes (if applicable)
  - reusable functions (if there are many separate via a section banner)

# Naming and placement

  - `thing.tsx` is a detail page, `things.tsx` a list page, `thing-verb.tsx` another routed page (`quote-edit.tsx`).
  - `thing--part.tsx` (double dash) is a **part** of that thing and is never routed: `charge--table.tsx`,
    `organisation--price-list.tsx`, `quote--send-modal.tsx`.
  - `_name-not-used.tsx` is parked code, commented out, kept only for reference.
  - A file lives in the folder of the thing it renders, not the page that imports it. A charge line used by the quote
    editor belongs in `charges/`, not `quotes/`.
  - If it renders no one thing and is used across features, it's a shared element: `components/partials/elements/`.
  - Renaming is part of the job. When a file's role changes, rename the file and its exports together
    (`quote--charge-line.tsx` → `charge--document-line.tsx`, `ChargeLine` → `DocumentLine`).

# Split at the level something is shared

  Components nest, e.g: page > sibling-modal, table > row > cell > field. By default every level lives inside its owner, and
  you cut along that hierarchy, rarely across it: `row-big` and `row-small` are the same level twice, not a split.

  Two separate questions, in this order. Most levels stop at the first one.

  ## 1. Does the level need to be a component at all?

    Usually not. Nesting in the markup is not a reason to make a component, and neither is a calculation: that goes in
    a function inside the parent, or a helper below it. A level stays plain JSX until it has a lot of its own: state,
    hooks, markup getting big and complex (e.g. 5+ nested levels), or markup genuinely repeated in more than one place.

    ```tsx
    // Bad: a component per level, neither is repeated and neither is complex enough to earn one
    <ThingRow row={row}><ThingCell col={col} row={row} /></ThingRow>

    // Good: the levels stay inside the table, a small function where it repeats
    <tr>{columns.map(col => renderCell(col, row))}</tr>
    ```

  ## 2. Does that component earn its own file?

    A component, and the children under it, earns its own file when:

    - atleast two/three parents use it (depending on the complexity of the component),
    - it's a decent-sized piece with a job of its own, like a page or a modal,
    - or its owner is nearing ~800 lines, so something has to come out.

    Worked example, an inline-editable table:

    ```
    First attempt, a file per level:
    things/
      thing--table.tsx      columns
      thing--edit-row.tsx   edit state + edit cells
      thing--cells.tsx      read cells

    The row and the cells had one parent each, so they folded into the table. The fields below them are used by the
    table and by another component, so that is the level that earned a file:
    things/
      things.tsx            page, fetches and renders <ThingTable>
      thing--table.tsx      the table, its row state, its read and edit cells
      thing--fields.tsx     the editors, shared with the other component
      thing--modal.tsx      its own job, opened by the page
    ```

    When a split doesn't hold, look further down the hierarchy before looking sideways: the reusable piece is usually a
    level below the one you tried to cut at.

    Inside the owner file, use section banners where those files would have been:

    ```tsx
    const tableClassName = '…'
    const columns = [ … ]
    // ---- Components -------------------------------
    export function ThingTable(props: ThingTableProps) { … }
    // ---- Helpers ----------------------------------
    function renderEditCell(col, ctx, i?) { … }
    function renderCell(col, row) { … }
    ```

    Files kept this way rarely reach ~800 lines in the first place.

# Comment banners

  A banner's total line length, indentation included, always ends at exactly 49 characters — pad the trailing dashes
  to reach it, not the leading ones. A nested banner starts with less room and so gets fewer dashes:

  ```tsx
  // ---- Components ------------------------------
      // ---- Helpers -----------------------------
  ```

# No wrapper components without substance

  A component that only forwards props to another component isn't worth its file space or its import. Inline the
  underlying component at the call site instead.

  ```tsx
  // Bad: a wrapper that only renames props
  export function CodeField({ state, path, onChange, className }: FieldProps) {
    return <Field name={`${path}.code`} state={state} placeholder="E.g. CUS" className={className} … />
  }

  // Good: just use Field where you need it
  <Field name={`${path}.code`} state={state} placeholder="E.g. CUS" … />
  ```

  A shared component earns its place once it holds real logic. One `ChargeField` replaced seven passthrough wrappers
  because it decides input vs select, currency vs percent, a paired min/rate control and each placeholder. A
  discriminator prop is what lets one component carry all of it.

  ```tsx
  <ChargeField {...field} field="sellRate" />
  <ChargeField {...field} field="unit" />
  ```

  Same for basic functions: skip a lambda that only pre-fills a few arguments when the util can be called directly.

  ```tsx
  const money = (n) => format(n, { currency }) // Bad
  format(n, formatOpts)                        // Good
  ```

  Same test for an optional section inside a component: if it has no substance of its own, fold it into the parent and
  let a prop turn it on, rather than making it a separate component the parent conditionally renders.

  ```tsx
  // the supplier filter is markup, not a component: the parent renders it when told to
  <ChargeTable filters={{ orgs, showSupplier: true }} />
  ```

# State belongs to the component that renders it

  Don't export a hook plus helper functions for a single consumer. State, and the row/item helpers that read it, live
  inside the component; callers pass props.

# Naming exports and internals

  Exports carry the entity (`ChargeTable`, `ChargeField`); file-private names drop it (`columns`, `tableClassName`,
  `renderCell`, `ExpiredIcon`). Rename when the old name is inaccurate or vague: e.g. `isChargeRow` (depending on context, can mean either row type) → `isNotVariationRow`.

# Pages stay thin

  A page fetches its data, holds its modals, and passes both down. Anything the feature/sub component can work out for
  itself doesn't belong here.

  ```tsx
  const [charges, isLoading] = useFetch(`/api/charges`)
  ...
  <ChargeTable
    rows={rows} isLoading={isLoading} orgs={orgs} showSupplier={true}
    rowMenu={(row) => [{ label: 'Remove Charge', onClick: () => setRemoveIds([row._id]) }]}
    onBulkRemove={setRemoveIds} onSaved={…} savedMessage="Charge saved successfully."
  />
  ```

# Props and comments

  - One props object typed above the component (`type ThingTableProps = { … }`), keys alphabetised, a short comment
    only on the non-obvious ones.
  - The summary comment goes **inside** the function as its first line, not as JSDoc above it.
  - Number the parts of a compound comment: `// 1) inputs move left, 2) show only red outline, 3) darken when resting`.
