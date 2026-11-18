import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root, sourceFiles, requireApproval, copyPublicInput} from './release.mjs';

if (process.argv.includes('--stage')) {
  await requireApproval();
  const output = process.argv[3];
  if (!output || !path.isAbsolute(output)) {
    throw new Error('Pass an absolute path to a new, empty destination.');
  }
  await fs.mkdir(output);
  for (const relative of sourceFiles) {
    const destination = path.join(output, relative);
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await copyPublicInput(relative, destination);
  }
  console.log(`Staged ${sourceFiles.length} allowlisted source files at ${output}`);
} else if (process.argv.includes('--source')) {
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'});
  if (git(['rev-parse','--show-toplevel']).trim() !== root) {
    throw new Error('Release source must be in its own repository.');
  }
  const tracked = git(['ls-files','--stage','-z']).split('\0').filter(Boolean);
  const expected = new Set(sourceFiles);
  const problems = [];
  for (const entry of tracked) {
    const tab = entry.indexOf('\t');
    const relative = entry.slice(tab + 1);
    if (!expected.delete(relative) || !/^100(644|755) [a-f0-9]+ 0$/.test(entry.slice(0,tab))) {
      problems.push(relative);
    }
  }
  if (problems.length || expected.size) {
    throw new Error(`Source allowlist mismatch. Unexpected: ${problems.join(', ')}. Missing: ${[...expected].join(', ')}.`);
  }
  console.log(`Verified ${tracked.length} tracked source files.`);
} else {
  console.log(sourceFiles.join('\n'));
}
