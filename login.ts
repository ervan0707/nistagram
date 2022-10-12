import { Client } from './src';
import fs from 'fs';
import path from 'path';

const ig = new Client();

(async () => {
  await ig.request.login('username', 'password');
  // or use session
  // const session = JSON.parse(fs.readFileSync(path.resolve() + '/users.json', 'utf8'));
  // ig.state.setSession(session);
  const { data } = (await ig.request.getTimeline()) as any;
  console.log(JSON.stringify(data.user.edge_web_feed_timeline, null, 2));
})();
