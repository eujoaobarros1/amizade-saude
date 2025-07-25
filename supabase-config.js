// supabase-config.js
const SUPABASE_URL = 'https://lktcyqtbxticsnkyodmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdGN5cXRieHRpY3Nua3lvZG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTYzNzIsImV4cCI6MjA2NjUzMjM3Mn0.xruT0n7A94ELZa5blPpIso1ug0S4meNxjZKSfxGyXYM';

// ⛔️ Este erro ocorre quando `supabase` ainda não está disponível globalmente
// ✅ Correto: usa o objeto global `window.supabase`
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
