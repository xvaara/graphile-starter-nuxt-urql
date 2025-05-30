# GraphQL Codegen Client Preset Migration

This document outlines the migration from separate GraphQL files to the GraphQL Codegen client preset approach.

## What Changed

### Before (Separate Files)
- GraphQL queries and mutations were defined in separate `.graphql` files
- Generated functions like `useLoginMutation()`, `useSettingsPasswordQuery()` were imported
- Fragments were defined in separate files and imported using `#import` syntax

### After (Client Preset)
- GraphQL queries and mutations are defined inline using the `graphql()` function
- Standard Apollo composables (`useQuery`, `useMutation`, `useLazyQuery`) are used
- Better type safety with fragment masking
- Improved tree-shaking and bundle splitting

## Migration Steps Completed

### 1. Updated CodeGen Configuration
```typescript
// codegen.ts
const config: CodegenConfig = {
  schema: './data/schema.graphql',
  documents: ['app/**/*.vue', 'app/**/*.ts'],
  generates: {
    './app/graphql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
    },
  },
}
```

### 2. Converted Pages

#### Authentication Pages
- ✅ `app/pages/login.vue`
- ✅ `app/pages/register.vue`
- ✅ `app/pages/forgot.vue`
- ✅ `app/pages/reset.vue`
- ✅ `app/pages/verify.vue`

#### Settings Pages
- ✅ `app/pages/settings/index.vue`
- ✅ `app/pages/settings/security.vue`
- ✅ `app/pages/settings/accounts.vue`
- ✅ `app/pages/settings/emails.vue`
- ✅ `app/pages/settings/delete.vue`

#### Organization Pages
- ✅ `app/pages/create-organization/index.vue`
- ✅ `app/pages/o/[slug]/index.vue`
- ✅ `app/pages/o/[slug]/settings.vue` **(Complex page with 8 GraphQL operations)**
- ✅ `app/pages/invitations/accept.vue`

#### Composables
- ✅ `app/composables/useAuth.ts`

### 3. Migration Pattern

**Before:**
```vue
<script setup>
const { mutate: login, loading } = useLoginMutation()
</script>
```

**After:**
```vue
<script setup>
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/graphql'

const loginMutation = graphql(`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      user {
        id
        username
        name
      }
    }
  }
`)

const { mutate: login, loading } = useMutation(loginMutation)
</script>
```

## Benefits Achieved

### 1. Better Type Safety
- Fragment masking ensures components only access requested data
- Typed document nodes provide full type safety
- Better IntelliSense support

### 2. Improved Performance
- Better tree-shaking eliminates unused code
- Improved bundle splitting
- Reduced bundle size

### 3. Developer Experience
- Queries and mutations are co-located with components
- No need to maintain separate GraphQL files
- Better debugging with inline queries

### 4. Maintainability
- Easier to see what data a component uses
- Reduced file switching when working on features
- Clearer data dependencies

## Remaining Work

✅ **All pages have been successfully converted!**

The organization settings page was the last complex page to be converted, featuring:
- 8 different GraphQL operations (2 queries + 6 mutations)
- Complex member management functionality
- Organization CRUD operations
- Multi-tab interface with different GraphQL operations per tab

## Usage Examples

### Query Example
```vue
<script setup>
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/graphql'

const userQuery = graphql(`
  query CurrentUser {
    currentUser {
      id
      name
      email
    }
  }
`)

const { data, loading, error } = useQuery(userQuery)
</script>
```

### Mutation Example
```vue
<script setup>
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/graphql'

const updateUserMutation = graphql(`
  mutation UpdateUser($id: UUID!, $patch: UserPatch!) {
    updateUser(input: { id: $id, patch: $patch }) {
      user {
        id
        name
        username
      }
    }
  }
`)

const { mutate: updateUser, loading } = useMutation(updateUserMutation)
</script>
```

### Fragment Example
```vue
<script setup>
import { graphql, useFragment } from '~/graphql'

const userFragment = graphql(`
  fragment UserInfo on User {
    id
    name
    username
    email
  }
`)

// Use fragment in component
const user = useFragment(userFragment, props.userData)
</script>
```

## Build Status

✅ **Build Successful** - The application builds without errors after the migration.

## Next Steps

1. Convert remaining complex pages
2. Consider adding ESLint rules to enforce client preset patterns
3. Update team documentation and training materials
4. Monitor bundle size improvements in production
