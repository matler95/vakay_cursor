// src/lib/supabaseClient.ts
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database.types' // We will create this file next

export const supabase = createPagesBrowserClient<Database>()