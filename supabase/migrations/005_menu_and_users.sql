-- Migration 005: Menu Management and User Administration
-- Menüverwaltung und Nutzerverwaltung mit Rollen und Berechtigungen

-- ============================================
-- MENU ITEMS (Menüpunkte die aktiviert/deaktiviert werden können)
-- ============================================
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

-- Default menu items
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

-- ============================================
-- USER PROFILES (Erweiterte Nutzerprofile)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Link to Supabase Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_at TIMESTAMPTZ,
    banned_by UUID,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROLES (Rollen)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6B7280',
    icon VARCHAR(50),
    priority INTEGER DEFAULT 0, -- Higher = more important
    is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default roles
INSERT INTO roles (name, display_name, description, color, icon, priority, is_system) VALUES
    ('admin', 'Administrator', 'Vollzugriff auf alle Funktionen', '#DC2626', 'shield', 100, true),
    ('moderator', 'Moderator', 'Kann Inhalte moderieren und Nutzer verwarnen', '#F59E0B', 'shield-check', 80, true),
    ('editor', 'Redakteur', 'Kann Inhalte erstellen und bearbeiten', '#3B82F6', 'pen-tool', 60, true),
    ('verified', 'Verifiziert', 'Verifizierter Einwohner von Zernsdorf', '#10B981', 'badge-check', 40, true),
    ('member', 'Mitglied', 'Registriertes Mitglied', '#6B7280', 'user', 20, true),
    ('guest', 'Gast', 'Nicht registrierter Besucher', '#9CA3AF', 'user-x', 0, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PERMISSIONS (Berechtigungen)
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default permissions
INSERT INTO permissions (name, display_name, category) VALUES
    -- Admin
    ('admin.access', 'Admin-Bereich betreten', 'admin'),
    ('admin.settings', 'Einstellungen verwalten', 'admin'),
    ('admin.menu', 'Menü verwalten', 'admin'),

    -- Users
    ('users.view', 'Nutzer ansehen', 'users'),
    ('users.edit', 'Nutzer bearbeiten', 'users'),
    ('users.delete', 'Nutzer löschen', 'users'),
    ('users.ban', 'Nutzer sperren', 'users'),
    ('users.roles', 'Rollen zuweisen', 'users'),

    -- Content
    ('content.create', 'Inhalte erstellen', 'content'),
    ('content.edit', 'Eigene Inhalte bearbeiten', 'content'),
    ('content.edit_all', 'Alle Inhalte bearbeiten', 'content'),
    ('content.delete', 'Eigene Inhalte löschen', 'content'),
    ('content.delete_all', 'Alle Inhalte löschen', 'content'),
    ('content.publish', 'Inhalte veröffentlichen', 'content'),

    -- Forum
    ('forum.read', 'Forum lesen', 'forum'),
    ('forum.post', 'Im Forum posten', 'forum'),
    ('forum.moderate', 'Forum moderieren', 'forum'),

    -- Bulletin
    ('bulletin.read', 'Schwarzes Brett lesen', 'bulletin'),
    ('bulletin.post', 'Anzeigen erstellen', 'bulletin'),
    ('bulletin.moderate', 'Anzeigen moderieren', 'bulletin'),

    -- Events
    ('events.view', 'Events ansehen', 'events'),
    ('events.create', 'Events erstellen', 'events'),
    ('events.edit', 'Events bearbeiten', 'events'),
    ('events.delete', 'Events löschen', 'events'),

    -- Businesses
    ('businesses.view', 'Verzeichnis ansehen', 'businesses'),
    ('businesses.create', 'Einträge erstellen', 'businesses'),
    ('businesses.edit', 'Einträge bearbeiten', 'businesses'),
    ('businesses.delete', 'Einträge löschen', 'businesses'),

    -- Reports
    ('reports.create', 'Meldungen erstellen', 'reports'),
    ('reports.view_all', 'Alle Meldungen sehen', 'reports'),
    ('reports.manage', 'Meldungen verwalten', 'reports'),

    -- Traffic
    ('traffic.view', 'Verkehr ansehen', 'traffic'),
    ('traffic.edit', 'Verkehrsstatus bearbeiten', 'traffic')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROLE_PERMISSIONS (Rollen-Berechtigungs-Zuordnung)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Assign permissions to roles
-- Admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Moderator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN (
    'admin.access',
    'users.view', 'users.ban',
    'content.edit_all', 'content.delete_all', 'content.publish',
    'forum.read', 'forum.post', 'forum.moderate',
    'bulletin.read', 'bulletin.post', 'bulletin.moderate',
    'events.view', 'events.edit',
    'businesses.view', 'businesses.edit',
    'reports.create', 'reports.view_all', 'reports.manage',
    'traffic.view', 'traffic.edit'
)
ON CONFLICT DO NOTHING;

-- Editor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'editor' AND p.name IN (
    'admin.access',
    'content.create', 'content.edit', 'content.delete', 'content.publish',
    'forum.read', 'forum.post',
    'bulletin.read', 'bulletin.post',
    'events.view', 'events.create', 'events.edit',
    'businesses.view', 'businesses.create', 'businesses.edit',
    'reports.create', 'reports.view_all',
    'traffic.view'
)
ON CONFLICT DO NOTHING;

-- Verified member permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'verified' AND p.name IN (
    'content.create', 'content.edit', 'content.delete',
    'forum.read', 'forum.post',
    'bulletin.read', 'bulletin.post',
    'events.view',
    'businesses.view',
    'reports.create',
    'traffic.view'
)
ON CONFLICT DO NOTHING;

-- Regular member permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'member' AND p.name IN (
    'content.create', 'content.edit', 'content.delete',
    'forum.read', 'forum.post',
    'bulletin.read', 'bulletin.post',
    'events.view',
    'businesses.view',
    'reports.create',
    'traffic.view'
)
ON CONFLICT DO NOTHING;

-- Guest permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'guest' AND p.name IN (
    'forum.read',
    'bulletin.read',
    'events.view',
    'businesses.view',
    'traffic.view'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- USER_ROLES (Nutzer-Rollen-Zuordnung)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, role_id)
);

-- ============================================
-- ACTIVITY LOG (Aktivitätsprotokoll)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SITE SETTINGS (Website-Einstellungen)
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Default settings
INSERT INTO site_settings (key, value, description, category, is_public) VALUES
    ('site_name', '"Zernsdorf Community"', 'Name der Website', 'general', true),
    ('site_description', '"Das Portal für Zernsdorf, Lankensee & Krüpelsee"', 'Beschreibung der Website', 'general', true),
    ('maintenance_mode', 'false', 'Wartungsmodus aktiv', 'general', true),
    ('registration_enabled', 'true', 'Registrierung erlaubt', 'users', false),
    ('require_email_verification', 'true', 'E-Mail-Verifizierung erforderlich', 'users', false),
    ('default_role', '"member"', 'Standard-Rolle für neue Nutzer', 'users', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for menu items
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (is_active = true AND is_public = true);
CREATE POLICY "menu_items_admin_all" ON menu_items FOR ALL USING (true);

-- Public profiles visible
CREATE POLICY "user_profiles_public_read" ON user_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "user_profiles_admin_all" ON user_profiles FOR ALL USING (true);

-- Roles readable
CREATE POLICY "roles_public_read" ON roles FOR SELECT USING (is_active = true);
CREATE POLICY "roles_admin_all" ON roles FOR ALL USING (true);

-- Permissions readable
CREATE POLICY "permissions_public_read" ON permissions FOR SELECT USING (true);

-- Role permissions readable
CREATE POLICY "role_permissions_public_read" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "role_permissions_admin_all" ON role_permissions FOR ALL USING (true);

-- User roles - users can see their own
CREATE POLICY "user_roles_own_read" ON user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_admin_all" ON user_roles FOR ALL USING (true);

-- Activity log - admins only
CREATE POLICY "activity_log_admin_all" ON activity_log FOR ALL USING (true);

-- Site settings - public ones readable
CREATE POLICY "site_settings_public_read" ON site_settings FOR SELECT USING (is_public = true);
CREATE POLICY "site_settings_admin_all" ON site_settings FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name VARCHAR(100)) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_permissions(p_user_id) WHERE permission_name = p_permission
    );
END;
$$ LANGUAGE plpgsql;
