import { createClient } from '@supabase/supabase-js';

// Public by design — Supabase's anon key is meant to be embedded in
// client-side code. Real access control lives in the Postgres Row Level
// Security policies (see supabase/schema.sql), not in hiding this key.
const SUPABASE_URL = 'https://fwssqdjfmlpejjhqqkfx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3c3NxZGpmbWxwZWpqaHFxa2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMjM3ODAsImV4cCI6MjEwMjU5OTc4MH0.H8TSHok_iLsuCJc7RnE3N76jSKn9g1Ea3qgIKd-iOhU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
