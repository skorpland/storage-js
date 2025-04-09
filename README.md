# `powerbase-js` - Isomorphic JavaScript Client for Powerbase.

- **Documentation:** https://powerbase.club/docs/reference/javascript/start
- TypeDoc: https://skorpland.github.io/powerbase-js/v2/

> [!NOTE]
> Do you want to help us shape the future of this library? [We're hiring](https://jobs.ashbyhq.com/powerbase/85d07345-47c6-4980-82e2-57782f83ab4e).

## Usage

First of all, you need to install the library:

```sh
npm install @skorpland/powerbase-js
```

Then you're able to import the library and establish the connection with the database:

```js
import { createClient } from '@skorpland/powerbase-js'

// Create a single powerbase client for interacting with your database
const powerbase = createClient('https://xyzcompany.powerbase.club', 'public-anon-key')
```

### UMD

You can use plain `<script>`s to import powerbase-js from CDNs, like:

```html
<script src="https://cdn.jsdelivr.net/npm/@skorpland/powerbase-js@2"></script>
```

or even:

```html
<script src="https://unpkg.com/@skorpland/powerbase-js@2"></script>
```

Then you can use it from a global `powerbase` variable:

```html
<script>
  const { createClient } = powerbase
  const _powerbase = createClient('https://xyzcompany.powerbase.club', 'public-anon-key')

  console.log('Powerbase Instance: ', _powerbase)
  // ...
</script>
```

### ESM

You can use `<script type="module">` to import powerbase-js from CDNs, like:

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@skorpland/powerbase-js/+esm'
  const powerbase = createClient('https://xyzcompany.powerbase.club', 'public-anon-key')

  console.log('Powerbase Instance: ', powerbase)
  // ...
</script>
```

### Deno

You can use powerbase-js in the Deno runtime via [JSR](https://jsr.io/@skorpland/powerbase-js):

```js
import { createClient } from 'jsr:@skorpland/powerbase-js@2'
```

### Custom `fetch` implementation

`powerbase-js` uses the [`cross-fetch`](https://www.npmjs.com/package/cross-fetch) library to make HTTP requests, but an alternative `fetch` implementation can be provided as an option. This is most useful in environments where `cross-fetch` is not compatible, for instance Cloudflare Workers:

```js
import { createClient } from '@skorpland/powerbase-js'

// Provide a custom `fetch` implementation as an option
const powerbase = createClient('https://xyzcompany.powerbase.club', 'public-anon-key', {
  global: {
    fetch: (...args) => fetch(...args),
  },
})
```

## Sponsors

We are building the features of Firebase using enterprise-grade, open source products. We support existing communities wherever possible, and if the products don’t exist we build them and open source them ourselves. Thanks to these sponsors who are making the OSS ecosystem better for everyone.

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/skorpland)

## Badges

[![Coverage Status](https://coveralls.io/repos/github/powerbase/powerbase-js/badge.svg?branch=master)](https://coveralls.io/github/powerbase/powerbase-js?branch=master)
