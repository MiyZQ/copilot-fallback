import * as path from 'path';
import * as fs from 'fs';
import { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath } from '@vscode/test-electron';

async function main() {
  try {
    const vscodeExecutablePath = await downloadAndUnzipVSCode();
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);

    console.log('VS Code executable path:', vscodeExecutablePath);
    console.log('CLI path:', cliPath);
  } catch (err) {
    console.error('Error downloading VS Code:', err);
    process.exit(1);
  }
}

main();