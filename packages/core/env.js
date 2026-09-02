import dotenv from 'dotenv'

// Loads .env, then merges .env.local over the top. Import this before anything that reads process.env.
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local', override: true })
