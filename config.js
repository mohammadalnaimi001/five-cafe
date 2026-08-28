/* =====================================================================
   FIVE₅ COFFEE — the only file you need to edit to go live.
   ===================================================================== */
window.FV_CONFIG = {

  /* ---- Supabase -----------------------------------------------------
     Supabase dashboard → Project Settings → API
     Paste the Project URL and the **anon / public** key.
     The anon key is meant to be public — it is safe in the browser,
     because Row Level Security (see supabase/schema.sql) is what
     actually protects the data. NEVER paste the service_role key here. */
  SUPABASE_URL:      'https://qwhnbyvveymcbxfsbnhu.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_5gSGEU7ufMd2ak3k7pSI8w_ibwKw3dX',

  /* ---- Demo mode ----------------------------------------------------
     true  = no backend, everything runs in the browser with sample data.
             Use this to show the site to a client before the DB is set up.
     false = talk to Supabase for real. Flip this after you run schema.sql. */
  DEMO: false,

  /* ---- Admin dashboard ---------------------------------------------- */
  ADMIN_REFRESH_MS: 12000,   // how often the dashboard re-checks for new bookings

  /* ---- Contact (used for WhatsApp / call links) ----------------------
     These are also stored in the DB; this is the fallback if it is down. */
  WHATSAPP: '962792225059',
  PHONE:    '0792225059',
  INSTAGRAM:'five5coffee',
  MAPS:     'https://www.google.com/maps/search/?api=1&query=XR8V%2BVR%20Amman'
};
