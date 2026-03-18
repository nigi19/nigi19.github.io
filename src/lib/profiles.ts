import { supabase } from './supabase';

export async function getDisplayName(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single();
  return data?.display_name ?? null;
}

export async function getAllDisplayNames(): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name');
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.id, row.display_name);
  }
  return map;
}

export async function upsertDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: displayName.trim() }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}
