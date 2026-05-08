import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wfgryifphuxikcuvwvix.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZ3J5aWZwaHV4aWtjdXZ3dml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI0NjcsImV4cCI6MjA5MzEyODQ2N30.2tZIodr4WnGd1Eh-C_BvxIMG-ikvOrz-06CF1lB8WuY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
