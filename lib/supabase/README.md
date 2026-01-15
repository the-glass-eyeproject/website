# Supabase Client Configuration

This directory contains the Supabase client setup for The Glass Eye Project.

## Files

- **`client.ts`** - Browser/client-side Supabase client
- **`server.ts`** - Server-side Supabase client (for API routes)
- **`types.ts`** - TypeScript types for database schema

## Usage

### Client-Side (React Components)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('photos').select('*')
```

### Server-Side (API Routes)

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('photos').select('*')
  return Response.json(data)
}
```

### Service Role (Admin Operations - Use Sparingly)

```typescript
import { createServiceClient } from '@/lib/supabase/server'

// Only use for operations that need to bypass RLS
const supabase = createServiceClient()
```

## Authentication

The server client automatically handles cookies for authentication. When a user signs in with Supabase Auth, their session is stored in cookies and automatically included in requests.

## Row Level Security

All tables have RLS enabled. The anon key is safe to use in client-side code because:
- RLS policies restrict what users can see/modify
- Users can only access their own data (where applicable)
- Public read access is allowed for photos (gallery)
