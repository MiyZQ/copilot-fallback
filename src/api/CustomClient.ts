import { ApiClient, CompletionRequest } from './ApiClient';

export class CustomClient implements ApiClient {
  constructor(
    private url: string,
    private apiKey: string,
    private model: string
  ) {}

  async complete(request: CompletionRequest): Promise<string> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        prompt: `${request.prefix}[光标]${request.suffix}`,
        max_tokens: request.maxTokens || 200,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { choices?: Array<{ text?: string; message?: { content?: string } }>; text?: string };
    
    // Try different response formats
    const content = data.choices?.[0]?.text 
      || data.choices?.[0]?.message?.content 
      || data.text 
      || '';
    
    return content;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}