import * as vscode from 'vscode';
import { SettingsManager } from './settings/SettingsManager';
import { ApiClient } from './api/ApiClient';
import { OpenAIClient } from './api/OpenAIClient';
import { AnthropicClient } from './api/AnthropicClient';
import { CustomClient } from './api/CustomClient';

export class InlineCompletionsProvider implements vscode.InlineCompletionItemProvider {
  private client: ApiClient | null = null;

  constructor(private settingsManager: SettingsManager) {}

  private getClient(): ApiClient | null {
    // Get config from active profile
    const config = this.settingsManager.getActiveConfig();
    if (!config) {
      vscode.window.showWarningMessage('Copilot Fallback: 请先选择一个模型配置');
      return null;
    }

    if (config.provider === 'openai') {
      return new OpenAIClient(config.config.baseUrl, config.config.apiKey, config.config.model);
    } else if (config.provider === 'anthropic') {
      return new AnthropicClient(config.config.apiKey, config.config.model);
    } else {
      return new CustomClient(config.config.url, config.config.apiKey, config.config.model);
    }
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[]> {
    // If fallback mode is disabled, let Copilot handle it
    if (!this.settingsManager.enable) {
      return [];
    }

    const client = this.getClient();
    if (!client) {
      return [];
    }

    const range = new vscode.Range(position, position);

    try {
      // Get the context around the cursor
      const prefix = document.getText(
        new vscode.Range(new vscode.Position(0, 0), position)
      );
      const suffix = document.getText(
        new vscode.Range(position, new vscode.Position(document.lineCount, 0))
      );

      const completion = await Promise.race([
        client.complete({ prefix, suffix }),
        this.timeout(3000)
      ]);

      return [{
        insertText: completion.trim(),
        range
      }];
    } catch (error) {
      console.error('Copilot Fallback error:', error);
      return [];
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ms);
    });
  }

  handleDidShowCompletionList(): void {}
  handleDidPartializeCompletion(): void {}
  handleDidAcceptCompletionItem(): void {}
}