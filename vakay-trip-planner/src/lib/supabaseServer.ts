// src/lib/supabaseServer.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '../types/database.types'

export const supabase = createRouteHandlerClient<Database>({ cookies })
