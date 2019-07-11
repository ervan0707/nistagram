## Usage
```bash
npm i nistagram
```

### Usage
```javascript
//ES6+

import Nistagram from 'nistagram';
let ig = new Nistagram();

(async() => {
  let session = await ig.login('username', 'password')
  let x = await ig.getTimeLineFeed();
  console.log(x)
})()

//Traditional JavaScript

var Nistagram = require('nistagram');
const ig = new Nistagram.default();

(async() => {
  let session = await ig.login('username', 'password')
  let x = await ig.getTimeLineFeed();
  console.log(x)
})()
```

## Author
@ervan0707