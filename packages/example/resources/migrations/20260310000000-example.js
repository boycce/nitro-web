/**
 * Example migration — rename a field across a collection.
 */

export const up = async (_db) => {
  // await db.collection('jobs').updateMany({}, { $rename: { oldField: 'newField' } })
}

export const down = async (_db) => {
  // await db.collection('jobs').updateMany({}, { $rename: { newField: 'oldField' } })
}
