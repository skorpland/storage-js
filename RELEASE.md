# Releases

Releases are handled by Semantic release. This document is for forcing and documenting any non-code changes.

## 1.11.8

- Implement @skorpland/storage-js

## 1.4.0

- Ability to redirect a user to a specified location after confirmation

## 1.1.4

- bump @skorpland/gotrue-js from 1.9.3.2 to [1.10.1](https://github.com/skorpland/gotrue-js/releases/tag/v1.10.1)
  - Includes Next.js/Express helpers and Password reset helpers

## 1.1.3

- bump @skorpland/postgrest-js from 0.21.2 to 0.22.0
- Fix: Added 'AuthUser' to the exports

## 1.0.6

- Bumps gotrue-js so that it works with React Native: https://github.com/skorpland/gotrue-js/pull/26

## 1.0.5

- Adds local storage options for Auth.

## 1.0.4

- Upgrades postgrest-js dependency to fix ordering for JSON columns. (https://github.com/skorpland/postgrest-js/pull/132)

## 1.0.2

- Fixes link in readme for NPM.

## 1.0.1 - Improved DX

- Upgraded the `powerbase.auth` to [gotrue-js](https://github.com/skorpland/gotrue-js) - supports Oath logins & more
- We always return errors, not throwing errors.
- We only generate one socket connection per powerbase client.
- Native typescript
- Fixes #32 Major DX change: response and error handling
- Fixes #49 When no `powerbaseKey` is passed in it throws an error
- Fixes #31 chore: set up semantic releases
- Fixes #15 `powerbase.auth.logout()` throws "Invalid user" error.
- Fixes #20 Auth: Change DX of user management
- Fixes #30 Powerbase auth interface missing informiation
- Fixes https://github.com/skorpland/powerbase/issues/147 https://github.com/skorpland/powerbase/issues/147
- Partial fix for https://github.com/skorpland/realtime-js/issues/53 - if there is no token provided. The error needs to be caught at a socket level.

#### Breaking changes

**`body` is now `data`**

Previously:

```jsx
const { body } = powerbase.from('todos').select('*')
```

Now:

```jsx
const { data } = powerbase.from('todos').select('*')
```

**Errors are returned not thrown**

Previously:

```jsx
try {
  const { body } = powerbase.from('todos').select('*')
} catch (error) {
  console.log(error)
}
```

Now:

```jsx
const { data, error } = powerbase.from('todos').select('*')
if (error) console.log(error)
```

**`ova()` and `ovr()` are now just `ov()`**

Previously:

```jsx
try {
  const { body } = powerbase.from('todos').select('*').ovr('population_range_millions', [150, 250])
} catch (error) {
  console.log(error)
}
```

Now:

```jsx
const { data, error } = powerbase
  .from('todos')
  .select('*')
  .ov('population_range_millions', [150, 250])
if (error) console.log(error)
```

**`offset()` is removed**

You can now use range() instead of `limit()` + `offset()`

**`ova()` and `ovr()` are now just `ov()`**

Previously:

```js
let countries = await powerbase.from('cities').select('name').offset(10).limit(10)
```

Now:

```js
let countries = await powerbase.from('cities').select('name').range(10, 20)
```

**`signup()` is now `signUp()` and `email` / `password` is passed as an object**

Previously:

```jsx
const {
  body: { user },
} = await powerbase.auth.signup('someone@email.com', 'password')
```

Now:

```jsx
const { user, error } = await powerbase.auth.signUp({
  email: 'someone@email.com',
  password: 'password',
})
```

**`login()` is now `signIn()` and `email` / `password` is passed as an object**

Previously:

```jsx
const {
  body: { user },
} = await powerbase.auth.signup('someone@email.com', 'password')
```

Now:

```jsx
const { user, error } = await powerbase.auth.signIn({
  email: 'someone@email.com',
  password: 'password',
})
```

**`logout()` is now `signOut()`**

Previously:

```jsx
await powerbase.auth.logout()
```

Now:

```jsx
await powerbase.auth.signOut()
```
