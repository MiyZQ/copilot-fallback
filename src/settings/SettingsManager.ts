import * as vscode from 'vscode';

export interface ModelProfile {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  baseUrl?: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface SettingsData {
  enable: boolean;
  profiles: ModelProfile[];
  activeProfileId: string | null;
}

export class SettingsManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('copilotFallback');
  }

  // Enable/Disable fallback mode
  get enable(): boolean {
    return this.getConfig().get<boolean>('enable', false);
  }

  setEnable(value: boolean): Thenable<void> {
    return this.getConfig().update('enable', value);
  }

  // Get all profiles
  get profiles(): ModelProfile[] {
    return this.getConfig().get<ModelProfile[]>('profiles', []);
  }

  setProfiles(profiles: ModelProfile[]): Thenable<void> {
    return this.getConfig().update('profiles', profiles);
  }

  // Get active profile ID
  get activeProfileId(): string | null {
    return this.getConfig().get<string | null>('activeProfileId', null);
  }

  setActiveProfileId(id: string | null): Thenable<void> {
    return this.getConfig().update('activeProfileId', id);
  }

  // Get active profile
  getActiveProfile(): ModelProfile | null {
    const profiles = this.profiles;
    const activeId = this.activeProfileId;
    if (!activeId) return null;
    return profiles.find(p => p.id === activeId) || null;
  }

  // Add a new profile
  addProfile(profile: ModelProfile): Thenable<void> {
    const profiles = this.profiles;
    profiles.push(profile);
    return this.setProfiles(profiles);
  }

  // Update a profile
  updateProfile(id: string, updates: Partial<ModelProfile>): Thenable<void> {
    const profiles = this.profiles.map(p => p.id === id ? { ...p, ...updates } : p);
    return this.setProfiles(profiles);
  }

  // Delete a profile
  deleteProfile(id: string): Thenable<void> {
    const profiles = this.profiles.filter(p => p.id !== id);
    // If deleted profile was active, clear active
    if (this.activeProfileId === id) {
      return this.setProfiles(profiles).then(() => this.setActiveProfileId(null));
    }
    return this.setProfiles(profiles);
  }

  // Get config for active profile
  getActiveConfig(): { provider: string; config: any } | null {
    const profile = this.getActiveProfile();
    if (!profile) return null;

    if (profile.provider === 'openai') {
      return {
        provider: 'openai',
        config: {
          baseUrl: profile.baseUrl || 'https://api.openai.com/v1',
          apiKey: profile.apiKey,
          model: profile.model
        }
      };
    } else if (profile.provider === 'anthropic') {
      return {
        provider: 'anthropic',
        config: {
          apiKey: profile.apiKey,
          model: profile.model
        }
      };
    } else {
      return {
        provider: 'custom',
        config: {
          url: profile.baseUrl || '',
          apiKey: profile.apiKey,
          model: profile.model
        }
      };
    }
  }

  // Legacy support - get OpenAI config
  getOpenAIConfig(): { baseUrl: string; apiKey: string; model: string } {
    const profile = this.getActiveProfile();
    if (profile && profile.provider === 'openai') {
      return {
        baseUrl: profile.baseUrl || 'https://api.openai.com/v1',
        apiKey: profile.apiKey,
        model: profile.model
      };
    }
    const config = vscode.workspace.getConfiguration('copilotFallback.openai');
    return {
      baseUrl: config.get<string>('baseUrl', 'https://api.openai.com/v1'),
      apiKey: config.get<string>('apiKey', ''),
      model: config.get<string>('model', 'gpt-4o-mini')
    };
  }

  // Legacy support - get Anthropic config
  getAnthropicConfig(): { apiKey: string; model: string } {
    const profile = this.getActiveProfile();
    if (profile && profile.provider === 'anthropic') {
      return {
        apiKey: profile.apiKey,
        model: profile.model
      };
    }
    const config = vscode.workspace.getConfiguration('copilotFallback.anthropic');
    return {
      apiKey: config.get<string>('apiKey', ''),
      model: config.get<string>('model', 'claude-sonnet-4-20250514')
    };
  }

  // Legacy support - get Custom config
  getCustomConfig(): { url: string; apiKey: string; model: string } {
    const profile = this.getActiveProfile();
    if (profile && profile.provider === 'custom') {
      return {
        url: profile.baseUrl || '',
        apiKey: profile.apiKey,
        model: profile.model
      };
    }
    const config = vscode.workspace.getConfiguration('copilotFallback.custom');
    return {
      url: config.get<string>('url', ''),
      apiKey: config.get<string>('apiKey', ''),
      model: config.get<string>('model', '')
    };
  }

  // Provider selection (legacy support)
  get provider(): 'openai' | 'anthropic' | 'custom' {
    return this.getConfig().get<'openai' | 'anthropic' | 'custom'>('provider', 'openai');
  }
}