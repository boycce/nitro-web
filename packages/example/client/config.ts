export default { 
  ...INJECTED_CONFIG as import('types').Config,

  middleware: {
    // extend default middleware here...
    isBatman: (_route: unknown, store: { user?: { isBatman?: boolean } }) => {
      if (store.user?.isBatman) return
      else return { redirect: '/signin?error=Only account holders of Wayne Enterprises can access this page.' }
    },
  },
}