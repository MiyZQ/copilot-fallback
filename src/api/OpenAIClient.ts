import { ApiClient, CompletionRequest } from './ApiClient';

export class OpenAIClient implements ApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string
  ) {}

  async complete(request: CompletionRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个代码补全助手。直接返回补全代码，不需要任何解释、注释或说明。只返回代码本身。'
          },
          {
            role: 'user',
            content: `请根据以下上下文补全代码（光标位置用 [光标] 标记）。只返回补全的代码，不需要任何其他内容：\n\n${request.prefix}[光标]${request.suffix}`
          }
        ],
        max_tokens: request.maxTokens || 200,
        temperature: 0.2,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}