/** Public, unauthenticated link to a single fact — see src/features/share/SharedFactPage.tsx
 * and the `to anon` read policy on the `facts` table in supabase/schema.sql. */
export function factShareUrl(factId: string): string {
  return `${window.location.origin}/f/${factId}`
}
