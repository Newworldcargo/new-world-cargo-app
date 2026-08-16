# API State-Layer Research Notes

## TanStack Query

The official React overview describes TanStack Query as a tool for fetching, caching, synchronizing, and updating **server state**. It distinguishes remotely persisted, asynchronous, shared, potentially stale data from ordinary client state.

The official defaults guide states that queries are stale by default, stale queries can refetch on mount, window focus, and reconnect, inactive queries are retained in cache for five minutes by default, and failed queries retry three times by default. The plan should set explicit New World Cargo defaults rather than relying on these defaults indiscriminately.

The official query-invalidation guide states that `invalidateQueries` marks matching queries stale and triggers background refetch for mounted matching queries. The official mutation guide states that mutations model create, update, delete, and server-side effects, with lifecycle hooks for invalidation and optimistic-update rollback.

Sources:

- https://tanstack.com/query/latest/docs/framework/react/overview
- https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
- https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- https://tanstack.com/query/latest/docs/framework/react/guides/mutations

## Zustand

The official Zustand documentation presents Zustand as a small, hook-based state-management solution. Its `persist` middleware can store selected client state across reloads using browser-backed storage. The API-readiness plan will keep server records out of Zustand and reserve it for durable, local workflow state only.

The official `persist` reference advises that browser storage values are JSON parsed and cast without runtime validation. The plan must therefore use schema-validated persisted values, explicit storage keys, a version number, `partialize` to persist only permitted fields, a migration function for version changes, and a logout reset.

The official TypeScript guide recommends typed store state and actions, selector-level subscriptions to reduce unnecessary renders, and `useShallow` when selecting multiple values. It also supports separate stores by domain. The implementation plan will use small typed stores, not a single app-wide store.

Sources:

- https://zustand.docs.pmnd.rs/
- https://zustand.docs.pmnd.rs/reference/middlewares/persist
- https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
