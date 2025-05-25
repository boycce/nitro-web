type TopbarProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
}

export function Topbar({ title, subtitle, className }: TopbarProps) {
  return (
    <div class={`flex flex-col min-h-12 gap-0.5 mb-6 nitro-topbar ${className||''}`}>
      <div class="text-2xl font-bold">{title}</div>
      { subtitle && <div class="text-sm text-muted-foreground">{subtitle}</div>}
      {/* { submenu && <div class="pt-2 text-large weight-500">{submenu}</div> } */}
    </div>
  )
}