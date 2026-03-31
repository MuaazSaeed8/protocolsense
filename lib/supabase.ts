import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfrqbewahjkfjsrewvbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnFiZXdhaGprZmpzcmV3dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzQ2MjcsImV4cCI6MjA5MDU1MDYyN30.sWSHjwH-XQEFDCsDU1vEuctqAXBIZKwRigg1mfHUHgw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
