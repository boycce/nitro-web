// E.g. npm run migrate:up
import 'nitro-web/env'
import monastery from 'monastery'

export default {
  mongodb: {
    url: (!process.env.mongoUrl.match(/^mongodb/) ? 'mongodb://' : '') + process.env.mongoUrl,
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
    },
  },
  migrationsDir: 'resources/migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'esm',
}

/** 
 * Reuse migrate-mongo's client as a monastery manager with access to raw collection operations. (karpark good example)
 * E.g. const doc = db.get('document'); await doc.update({ a: 1 }, { $set: { b: 2 } }, { multi: true })
*/
let db
export async function getDb(_db, client) {
  if (db) return db
  db = await monastery.manager(client, {
    noDefaults: true,
    nullObjects: true,
    useMilliseconds: true,
    promise: true,
  })
  return db
}