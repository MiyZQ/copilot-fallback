import { ApiClient, CompletionRequest } from './ApiClient';

export class AnthropicClient implements ApiClient {
  private apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(
    private apiKey: string,
    private model: string
  ) {}

  async complete(request: CompletionRequest): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: `你是一个代码补全助手。直接返回补全代码，不需要任何解释、注释或说明。只返回代码本身。\n\n请根据以下上下文补全代码（光标位置用 [光标] 标记）。只返回补全的代码，不需要任何其他内容：\n\n${request.prefix}[光标]${request.suffix}`
          }
        ],
        max_tokens: request.maxTokens || 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    return data.content[0]?.text || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/.well-known/models.json', {
        headers: { 'x-api-key': this.apiKey }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}