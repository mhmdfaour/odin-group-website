// Builds, checks, then pushes dist/ to the gh-pages branch. Run only from main after a merge.
import ghpages from 'gh-pages';
import { build } from './build.mjs';
import { check } from './check.mjs';

try {
  build();
  const problems = check();
  if (problems.length) throw new Error(`check failed:\n  ${problems.join('\n  ')}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
ghpages.publish('dist', { branch: 'gh-pages', dotfiles: true, message: 'Deploy site', repo: 'https://github.com/mhmdfaour/odin-group-website.git' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Published dist/ to gh-pages');
});
