import { supabase } from './supabase';

export type Priority = 'low' | 'medium' | 'high';

export interface FeatureRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: string;
  score: number;
  userVote: 1 | -1 | 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRequest(row: any, votes: any[], userId: string): FeatureRequest {
  const reqVotes = votes.filter((v) => v.feature_id === row.id);
  const score = reqVotes.reduce((s: number, v: any) => s + v.vote, 0);
  const myVote = reqVotes.find((v) => v.user_id === userId);
  return {
    id: row.id,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    title: row.title,
    description: row.description ?? '',
    priority: row.priority as Priority,
    createdAt: row.created_at,
    score,
    userVote: myVote ? myVote.vote : 0,
  };
}

export async function getFeatureRequests(userId: string): Promise<FeatureRequest[]> {
  const [{ data: requests, error }, { data: votes }] = await Promise.all([
    supabase.from('feature_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('feature_votes').select('*'),
  ]);
  if (error) throw new Error(error.message);
  return (requests ?? []).map((r) => rowToRequest(r, votes ?? [], userId));
}

export async function addFeatureRequest(
  userId: string,
  userDisplayName: string,
  title: string,
  description: string,
  priority: Priority,
): Promise<void> {
  const { error } = await supabase.from('feature_requests').insert({
    user_id: userId,
    user_display_name: userDisplayName,
    title,
    description,
    priority,
  });
  if (error) throw new Error(error.message);
}

export async function castVote(
  userId: string,
  featureId: string,
  value: 1 | -1,
  currentVote: 1 | -1 | 0,
): Promise<void> {
  if (currentVote === value) {
    // Same button clicked again — remove vote
    const { error } = await supabase
      .from('feature_votes')
      .delete()
      .eq('feature_id', featureId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  } else {
    // New vote or switching direction
    const { error } = await supabase
      .from('feature_votes')
      .upsert(
        { feature_id: featureId, user_id: userId, vote: value },
        { onConflict: 'feature_id,user_id' },
      );
    if (error) throw new Error(error.message);
  }
}
