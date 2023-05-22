import path from 'path';
import exec from '@simplyhexagonal/exec';
import { program } from 'commander';
import fs from 'fs';

async function main() {
  program.option('-v, --version <version>', 'New version to publish');

  program.parse(process.argv);

  const options = program.opts();
  console.log(options);
  const packageJsonPath = path.resolve('package.json');
  const packageJson = await import(packageJsonPath);
  const { execPromise } = exec(`npm view ${packageJson.name} version`);
  const execResult = await execPromise;
  if (execResult.exitCode !== 0) {
    throw new Error(execResult.stderrOutput.trim());
  }
  const latestVersion = execResult.stdoutOutput.toString().trim();
  const packageJsonVersion = packageJson.version;
  console.log({ latestVersion, packageJsonVersion })
  if (latestVersion > packageJsonVersion) {
    throw new Error(
      `Version ${packageJson.version} in ${packageJsonPath} is outdated. Latest version in npm is ${latestVersion}. Execute npm run npm-pull`
    );
  }
  if (latestVersion === packageJsonVersion) {
    const newVersion = options.version || 'patch';
    const { execPromise } = exec(`npm version ${newVersion}`);
    const execResult = await execPromise;
    if (execResult.exitCode !== 0) {
      throw new Error(execResult.stderrOutput);
    }
    console.log(execResult.stdoutOutput);
  }
  if (latestVersion < packageJsonVersion) {
    const deepPackage = await import('../deep.json');
    const packageJson = await import('../package.json');
    deepPackage.package.version = packageJson.version;

    fs.writeFileSync(
      path.resolve('deep.json'),
      JSON.stringify(deepPackage, null, 2),
      'utf-8'
    );
  }
}

main();
