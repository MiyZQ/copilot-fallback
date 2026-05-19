import * as vscode from 'vscode';
import { InlineCompletionsProvider } from './InlineCompletionsProvider';
import { StatusBarManager } from './status/StatusBarManager';
import { SettingsManager } from './settings/SettingsManager';
import { SettingsWebviewProvider } from './settings/SettingsWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  // Initialize settings manager
  const settingsManager = new SettingsManager(context);

  // Initialize status bar
  const statusBarManager = new StatusBarManager(settingsManager);
  statusBarManager.register();

  // Initialize inline completions provider
  const provider = new InlineCompletionsProvider(settingsManager);

  // Register inline completions provider for all languages
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      provider
    )
  );

  // Register webview
  const webviewProvider = new SettingsWebviewProvider(context, settingsManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('copilot-fallback.settings', webviewProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('copilot-fallback.enable', () => {
      settingsManager.setEnable(true);
      statusBarManager.update();
      vscode.window.showInformationMessage('Copilot Fallback: 已启用备用模式');
    }),
    vscode.commands.registerCommand('copilot-fallback.disable', () => {
      settingsManager.setEnable(false);
      statusBarManager.update();
      vscode.window.showInformationMessage('Copilot Fallback: 已禁用备用模式');
    }),
    vscode.commands.registerCommand('copilot-fallback.toggle', () => {
      const current = settingsManager.enable;
      settingsManager.setEnable(!current);
      statusBarManager.update();
      vscode.window.showInformationMessage(
        current ? 'Copilot Fallback: 已禁用备用模式' : 'Copilot Fallback: 已启用备用模式'
      );
    }),
    vscode.commands.registerCommand('copilot-fallback.debug', () => {
      const profiles = settingsManager.profiles;
      const enable = settingsManager.enable;
      const activeId = settingsManager.activeProfileId;
      vscode.window.showInformationMessage(
        'Debug: enable=' + enable + ', profiles=' + profiles.length + ', active=' + activeId
      );
      console.log('Debug info:', { enable, profiles, activeId });
    })
  );

  // Show welcome message on first activation
  const previousVersion = context.globalState.get<string>('version');
  if (!previousVersion) {
    vscode.window.showInformationMessage(
      'Copilot Fallback 已安装！请在设置中配置您的 API Key。'
    );
    context.globalState.update('version', '0.0.2');
  }
}

export function deactivate() {}