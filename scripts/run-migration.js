const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('Running menu_items migration...');

  // Create table using raw SQL via edge function or RPC
  // Since we can't run raw SQL, we'll check if table exists and insert data

  // First check if menu_items table exists by trying to query it
  const { data, error } = await supabase
    .from('menu_items')
    .select('id')
    .limit(1);

  if (error && error.code === 'PGRST205') {
    console.log('Table menu_items does not exist.');
    console.log('');
    console.log('Please run this SQL in Supabase Dashboard -> SQL Editor:');
    console.log('');
    console.log(`
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    path VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    required_role VARCHAR(50),
    parent_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO menu_items (key, name, name_en, icon, path, sort_order, is_active, is_public) VALUES
    ('home', 'Startseite', 'Home', 'home', '/', 1, true, true),
    ('forum', 'Forum', 'Forum', 'message-square', '/forum', 10, true, true),
    ('bulletin', 'Schwarzes Brett', 'Bulletin Board', 'clipboard-list', '/bulletin', 20, true, true),
    ('pets', 'Haustier-SOS', 'Pet SOS', 'paw-print', '/pets', 30, true, true),
    ('factcheck', 'Faktencheck', 'Fact Check', 'shield-check', '/factcheck', 40, true, true),
    ('report', 'Mängelmelder', 'Issue Reporter', 'trash-2', '/report', 50, true, true),
    ('listings', 'Marktplatz', 'Marketplace', 'star', '/listings', 60, true, true),
    ('events', 'Veranstaltungen', 'Events', 'calendar', '/events', 70, true, true),
    ('directory', 'Verzeichnis', 'Directory', 'map-pin', '/directory', 80, true, true),
    ('traffic', 'Verkehr', 'Traffic', 'car', '/traffic', 90, true, true),
    ('waste', 'Abfallkalender', 'Waste Calendar', 'calendar', '/waste', 100, true, true),
    ('history', 'Geschichte', 'History', 'history', '/history', 110, true, true)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_all" ON menu_items FOR ALL USING (true);
`);
    process.exit(1);
  } else if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } else {
    console.log('Table menu_items already exists!');
    console.log('Data:', data);
  }
}

runMigration();
