import { createClient } from '@supabase/supabase-js';
export const passwordSetupRequested = typeof window !== 'undefined' && ['invite','recovery'].includes(new URLSearchParams(window.location.hash.slice(1)).get('type') ?? '');
const googleCallback = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('state') && new URLSearchParams(window.location.search).has('code');
export const supabase = createClient('https://lbaqdguqaqgvjrripabj.supabase.co', 'sb_publishable_dDE3qXRacHVAqWaTe6gtng_wsqfr7iC', {auth: {detectSessionInUrl: !googleCallback}});
