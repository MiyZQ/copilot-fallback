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
    // 修复：状态栏显示与实际状态匹配
    this.statusItem.text = enabled
      ? '$(copilot) OFF'
      : '$(copilot) ON';
    this.statusItem.tooltip = enabled
      ? 'Copilot Fallback 已启用（点击禁用）'
      : 'Copilot Fallback 未启用（点击启用）';
    this.statusItem.backgroundColor = enabled
      ? undefined
      : new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  dispose(): void {
    this.statusItem.dispose();
  }
}