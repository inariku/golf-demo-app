import { openDB, type IDBPDatabase } from 'idb'

import type { SwingRecord } from '@/types'

const DB_NAME = 'golf-demo'
const STORE = 'swings'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      },
    })
  }
  return dbPromise
}

export async function saveSwing(record: SwingRecord): Promise<void> {
  const db = await getDB()
  await db.put(STORE, record)
}

export async function listSwings(): Promise<SwingRecord[]> {
  const db = await getDB()
  const all = (await db.getAllFromIndex(STORE, 'createdAt')) as SwingRecord[]
  return all.reverse()
}

export async function deleteSwing(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}
