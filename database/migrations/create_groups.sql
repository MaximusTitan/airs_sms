-- Run this SQL script in your Supabase SQL editor to create the group tables

-- Create lead_groups table
CREATE TABLE IF NOT EXISTS lead_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create group_memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_id UUID NOT NULL REFERENCES lead_groups(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    UNIQUE(group_id, lead_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_groups_user_id ON lead_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_lead_id ON group_memberships(lead_id);

-- Enable RLS for the new tables
ALTER TABLE lead_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Lead groups policies
CREATE POLICY "Users can view their own lead groups" ON lead_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead groups" ON lead_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead groups" ON lead_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead groups" ON lead_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Group memberships policies
CREATE POLICY "Users can view group memberships for their groups" ON group_memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lead_groups 
            WHERE lead_groups.id = group_memberships.group_id 
            AND lead_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create group memberships for their groups" ON group_memberships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lead_groups 
            WHERE lead_groups.id = group_memberships.group_id 
            AND lead_groups.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete group memberships for their groups" ON group_memberships
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lead_groups 
            WHERE lead_groups.id = group_memberships.group_id 
            AND lead_groups.user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_lead_groups_updated_at BEFORE UPDATE ON lead_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
