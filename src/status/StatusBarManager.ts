import * as vscode from 'vscode';
import { SettingsManager } from '../settings/SettingsManager';

export class StatusBarManager {
  private statusItem: vscode.StatusBarItem;

  constructor(private settingsManager: SettingsManager) {
    this.statusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusItem.command = 'copilot-fallback.toggle';
  }

  register(): void {
    this.update();
    this.statusItem.show();
  }

  update(): void {
    const enabled = this.settingsManager.enable;
    this.statusItem.text = enabled
      ? '$(copilot) Copilot Fallback: ON'
      : '$(copilot) Copilot Fallback: OFF';
    this.statusItem.tooltip = enabled
      ? 'Copilot Fallback 已启用（点击禁用）'
      : 'Copilot Fallback 未启用（点击启用）';
    this.statusItem.backgroundColor = enabled
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined;
  }

  dispose(): void {
    this.statusItem.dispose();
  }
}