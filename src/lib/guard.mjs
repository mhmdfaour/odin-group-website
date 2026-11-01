import { execFileSync } from 'node:child_process';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

/**
 * Deploy preconditions: clean tree, on main, and HEAD equal to origin/main (fetched first).
 * `allowBranch` skips the branch and origin/main checks (a clean tree is still required).
 */
export function deployProblems(cwd, { allowBranch = false, fetch = true } = {}) {
  const problems = [];
  if (git(cwd, 'status', '--porcelain')) problems.push('working tree is not clean; commit or discard changes first');
  if (allowBranch) return problems;
  const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'main') problems.push(`on branch "${branch}", not main (use --allow-branch to override)`);
  try {
    if (fetch) git(cwd, 'fetch', 'origin', 'main');
    if (git(cwd, 'rev-parse', 'HEAD') !== git(cwd, 'rev-parse', 'origin/main')) problems.push('HEAD is not equal to origin/main; pull or push first');
  } catch (e) {
    problems.push(`cannot compare with origin/main: ${e.message.split('\n')[0]}`);
  }
  return problems;
}
