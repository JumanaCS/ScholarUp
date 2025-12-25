import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlybrnxzdzlifdssdpln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1seWJybnh6ZHpsaWZkc3NkcGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTg2NDIsImV4cCI6MjA4MjIzNDY0Mn0.VmBO1_S2dEKtoAO9M3JpDa4dfe1km3VTVzfR4LceTSM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
