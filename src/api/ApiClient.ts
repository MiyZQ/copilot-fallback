export interface CompletionRequest {
  prefix: string;
  suffix: string;
  maxTokens?: number;
}

export interface ApiClient {
  complete(request: CompletionRequest): Promise<string>;
  testConnection(): Promise<boolean>;
}