export function Topbar({ title, subtitle, submenu, btns, className }) {
  /**
   * @param {string|JSX} title
   * @param {string|JSX} <subtitle>
   * @param {string|JSX} <submenu>
   * @param {url|function} <plusIconAction>
   */
  return (
    <div class={`flex justify-between items-end mb-6 ${className||''}`}>
      <div class="flex flex-col min-h-12">
        { subtitle && <div class="py-2 text-sm">{subtitle}</div>}
        <div class="flex items-center py-2">
          <h1 class="h1 mb-0">{title}</h1>
        </div>
        { 
          submenu && 
          <div class="pt-2 text-large weight-500">{submenu}</div>
        }
      </div>
      <div class="">
        {btns}
      </div>
    </div>
  )
}