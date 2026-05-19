import * as vscode from 'vscode';
import { SettingsManager, ModelProfile } from '../settings/SettingsManager';
import { OpenAIClient } from '../api/OpenAIClient';
import { AnthropicClient } from '../api/AnthropicClient';

export class SettingsWebviewProvider implements vscode.WebviewViewProvider {
  private webviewView: vscode.WebviewView | undefined;
  private context: vscode.ExtensionContext;
  private settingsManager: SettingsManager;
  private vscodeApi: any;

  constructor(context: vscode.ExtensionContext, settingsManager: SettingsManager) {
    this.context = context;
    this.settingsManager = settingsManager;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: []
    };

    const html = this.buildHtml();
    webviewView.webview.html = html;

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        await this.handleMessage(message);
      } catch (err) {
        vscode.window.showErrorMessage('Error: ' + String(err));
      }
    });
  }

  private async handleMessage(message: { type: string; data?: any }): Promise<void> {
    switch (message.type) {
      case 'init':
        await this.sendData();
        break;

      case 'setEnable':
        await this.settingsManager.setEnable(message.data);
        await this.sendData();
        break;

      case 'addProfile':
        await this.settingsManager.addProfile(message.data);
        await this.sendData();
        break;

      case 'updateProfile':
        await this.settingsManager.updateProfile(message.data.id, message.data.updates);
        await this.sendData();
        break;

      case 'deleteProfile':
        await this.settingsManager.deleteProfile(message.data);
        await this.sendData();
        break;

      case 'setActiveProfile':
        await this.settingsManager.setActiveProfileId(message.data);
        await this.sendData();
        break;

      case 'testConnection':
        await this.handleTestConnection(message.data);
        break;
    }
  }

  private async sendData(): Promise<void> {
    const data = {
      enable: this.settingsManager.enable,
      profiles: this.settingsManager.profiles,
      activeProfileId: this.settingsManager.activeProfileId
    };
    this.webviewView?.webview.postMessage({ type: 'data', data });
  }

  private async handleTestConnection(data: { provider: string; config: any }): Promise<void> {
    try {
      let success = false;
      let msg = '';

      if (data.provider === 'openai') {
        const client = new OpenAIClient(data.config.baseUrl, data.config.apiKey, data.config.model);
        success = await client.testConnection();
        msg = success ? '连接成功！' : '连接失败，请检查 API Key 和 Base URL';
      } else if (data.provider === 'anthropic') {
        const client = new AnthropicClient(data.config.apiKey, data.config.model);
        success = await client.testConnection();
        msg = success ? '连接成功！' : '连接失败，请检查 API Key';
      } else {
        msg = '未知的 Provider';
      }

      this.webviewView?.webview.postMessage({ type: 'testResult', data: { success, message: msg } });
    } catch (err) {
      this.webviewView?.webview.postMessage({ type: 'testResult', data: { success: false, message: '连接失败: ' + String(err) } });
    }
  }

  private buildHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--vscode-font-family); font-size: 13px; padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    h1 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .toggle-container { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 12px; background: var(--vscode-editorWidget-background); border-radius: 6px; }
    .toggle { width: 36px; height: 20px; background: var(--vscode-toggleInactiveBackground); border-radius: 10px; position: relative; cursor: pointer; transition: background 0.2s; }
    .toggle.active { background: var(--vscode-toggleActiveBackground); }
    .toggle::after { content: ''; position: absolute; width: 16px; height: 16px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: transform 0.2s; }
    .toggle.active::after { transform: translateX(16px); }
    .profile-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; min-height: 50px; }
    .profile-item { display: flex; align-items: center; padding: 10px 12px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .profile-item:hover { border-color: var(--vscode-focusBorder); }
    .profile-item.active { border-color: var(--vscode-focusBorder); background: var(--vscode-list-activeSelectionBackground); }
    .profile-item .info { flex: 1; }
    .profile-item .name { font-weight: 500; margin-bottom: 2px; }
    .profile-item .meta { font-size: 11px; color: var(--vscode-descriptionForeground); }
    .profile-item .actions { display: flex; gap: 4px; }
    .profile-item .btn-icon { width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; border-radius: 4px; font-size: 14px; }
    .profile-item .btn-icon:hover { background: var(--vscode-toolbar-hoverBackground); }
    .profile-item .btn-icon.delete:hover { background: rgba(217, 83, 79, 0.2); }
    .profile-item .radio { width: 16px; height: 16px; border: 2px solid var(--vscode-checkbox-border); border-radius: 50%; margin-right: 10px; position: relative; flex-shrink: 0; }
    .profile-item.active .radio { border-color: var(--vscode-focusBorder); }
    .profile-item.active .radio::after { content: ''; position: absolute; width: 8px; height: 8px; background: var(--vscode-focusBorder); border-radius: 50%; top: 2px; left: 2px; }
    .add-btn { width: 100%; padding: 10px; border: 2px dashed var(--vscode-widget-border); background: transparent; border-radius: 6px; cursor: pointer; color: var(--vscode-descriptionForeground); font-size: 13px; transition: all 0.2s; }
    .add-btn:hover { border-color: var(--vscode-focusBorder); color: var(--vscode-foreground); }
    .config-form { display: none; padding: 16px; background: var(--vscode-editorWidget-background); border-radius: 6px; margin-top: 12px; }
    .config-form.visible { display: block; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
    input, select { width: 100%; padding: 6px 8px; font-size: 13px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 2px; outline: none; }
    input:focus, select:focus { border-color: var(--vscode-focusBorder); }
    .btn-row { display: flex; gap: 8px; margin-top: 16px; }
    .btn { padding: 6px 16px; font-size: 13px; border: none; border-radius: 2px; cursor: pointer; }
    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .btn:hover { opacity: 0.9; }
    .status { margin-top: 12px; padding: 8px; border-radius: 4px; font-size: 12px; display: none; }
    .status.visible { display: block; }
    .status.success { background: rgba(46, 184, 46, 0.2); color: #2eb82e; }
    .status.error { background: rgba(217, 83, 79, 0.2); color: #e64a4a; }
    .empty-state { text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); }
    .hidden { display: none; }
    .form-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h1>Copilot Fallback</h1>

  <div class="toggle-container">
    <div class="toggle" id="enableToggle"></div>
    <span>启用备用模式</span>
  </div>

  <div class="profile-list" id="profileList">
    <div class="empty-state" id="emptyState">暂无配置，点击下方添加模型</div>
  </div>

  <button class="add-btn" id="addProfileBtn">+ 添加模型配置</button>

  <div class="config-form" id="configForm">
    <div class="form-title" id="formTitle">添加模型</div>
    <input type="hidden" id="editingProfileId">

    <div class="form-group">
      <label>配置名称</label>
      <input type="text" id="profileName" placeholder="例如：GPT-4o 工作">
    </div>

    <div class="form-group">
      <label>Provider</label>
      <select id="profileProvider">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="custom">自定义 API</option>
      </select>
    </div>

    <div class="form-group" id="baseUrlGroup">
      <label>Base URL</label>
      <input type="text" id="profileBaseUrl" placeholder="https://api.openai.com/v1">
    </div>

    <div class="form-group">
      <label>API Key</label>
      <input type="password" id="profileApiKey" placeholder="sk-...">
    </div>

    <div class="form-group">
      <label>模型</label>
      <input type="text" id="profileModel" placeholder="gpt-4o-mini">
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" id="saveProfileBtn">保存</button>
      <button class="btn btn-secondary" id="cancelProfileBtn">取消</button>
      <button class="btn btn-secondary" id="testBtn">测试连接</button>
    </div>
    <div class="status" id="formStatus"></div>
  </div>

  <script>
    // 对于 WebviewView，使用 parent.postMessage
    // WebviewView 和 WebviewPanel 的消息机制不同

    let profiles = [];
    let activeProfileId = null;
    let isEnabled = false;

    const toggle = document.getElementById('enableToggle');
    const profileList = document.getElementById('profileList');
    const emptyState = document.getElementById('emptyState');
    const configForm = document.getElementById('configForm');

    toggle.addEventListener('click', function() {
      isEnabled = !isEnabled;
      toggle.classList.toggle('active', isEnabled);
      parent.postMessage({ type: 'setEnable', data: isEnabled });
    });

    document.getElementById('addProfileBtn').addEventListener('click', function() {
      document.getElementById('editingProfileId').value = '';
      document.getElementById('profileName').value = '';
      document.getElementById('profileProvider').value = 'openai';
      document.getElementById('profileBaseUrl').value = 'https://api.openai.com/v1';
      document.getElementById('profileApiKey').value = '';
      document.getElementById('profileModel').value = 'gpt-4o-mini';
      document.getElementById('formTitle').textContent = '添加模型';
      configForm.classList.add('visible');
      updateBaseUrlVisibility();
    });

    document.getElementById('profileProvider').addEventListener('change', updateBaseUrlVisibility);

    function updateBaseUrlVisibility() {
      const provider = document.getElementById('profileProvider').value;
      const baseUrlGroup = document.getElementById('baseUrlGroup');
      if (provider === 'openai' || provider === 'custom') {
        baseUrlGroup.style.display = 'block';
      } else {
        baseUrlGroup.style.display = 'none';
      }
    }

    document.getElementById('saveProfileBtn').addEventListener('click', function() {
      const editingId = document.getElementById('editingProfileId').value;
      const profile = {
        id: editingId || ('profile_' + Date.now()),
        name: document.getElementById('profileName').value,
        provider: document.getElementById('profileProvider').value,
        baseUrl: document.getElementById('profileBaseUrl').value,
        apiKey: document.getElementById('profileApiKey').value,
        model: document.getElementById('profileModel').value,
        enabled: true
      };
      if (editingId) {
        parent.postMessage({ type: 'updateProfile', data: { id: editingId, updates: profile } });
      } else {
        parent.postMessage({ type: 'addProfile', data: profile });
      }
      configForm.classList.remove('visible');
    });

    document.getElementById('cancelProfileBtn').addEventListener('click', function() {
      configForm.classList.remove('visible');
    });

    document.getElementById('testBtn').addEventListener('click', function() {
      const statusEl = document.getElementById('formStatus');
      statusEl.textContent = '测试中...';
      statusEl.className = 'status visible';
      parent.postMessage({
        type: 'testConnection',
        data: {
          provider: document.getElementById('profileProvider').value,
          config: {
            baseUrl: document.getElementById('profileBaseUrl').value,
            apiKey: document.getElementById('profileApiKey').value,
            model: document.getElementById('profileModel').value
          }
        }
      });
    });

    // 初始化请求
    parent.postMessage({ type: 'init' });

    function renderProfiles() {
      const list = document.getElementById('profileList');
      const emptyEl = document.getElementById('emptyState');

      if (profiles.length === 0) {
        emptyEl.style.display = 'block';
        list.innerHTML = '';
        list.appendChild(emptyEl);
        return;
      }

      emptyEl.style.display = 'none';
      let html = '';
      for (var i = 0; i < profiles.length; i++) {
        var p = profiles[i];
        var isActive = p.id === activeProfileId ? 'active' : '';
        html += '<div class="profile-item ' + isActive + '" data-id="' + p.id + '">';
        html += '<div class="radio"></div>';
        html += '<div class="info">';
        html += '<div class="name">' + escapeHtml(p.name) + '</div>';
        html += '<div class="meta">' + p.provider.toUpperCase() + ' · ' + escapeHtml(p.model) + '</div>';
        html += '</div>';
        html += '<div class="actions">';
        html += '<button class="btn-icon edit" data-id="' + p.id + '">E</button>';
        html += '<button class="btn-icon delete" data-id="' + p.id + '">X</button>';
        html += '</div>';
        html += '</div>';
      }
      list.innerHTML = html;

      // 绑定事件
      list.querySelectorAll('.profile-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('btn-icon')) return;
          var id = item.getAttribute('data-id');
          activeProfileId = id;
          parent.postMessage({ type: 'setActiveProfile', data: id });
          renderProfiles();
        });
      });

      list.querySelectorAll('.edit').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-id');
          for (var j = 0; j < profiles.length; j++) {
            if (profiles[j].id === id) {
              var profile = profiles[j];
              document.getElementById('editingProfileId').value = profile.id;
              document.getElementById('profileName').value = profile.name;
              document.getElementById('profileProvider').value = profile.provider;
              document.getElementById('profileBaseUrl').value = profile.baseUrl || '';
              document.getElementById('profileApiKey').value = profile.apiKey;
              document.getElementById('profileModel').value = profile.model;
              document.getElementById('formTitle').textContent = '编辑模型';
              configForm.classList.add('visible');
              updateBaseUrlVisibility();
              break;
            }
          }
        });
      });

      list.querySelectorAll('.delete').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-id');
          if (confirm('确定删除这个配置？')) {
            parent.postMessage({ type: 'deleteProfile', data: id });
          }
        });
      });
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    window.addEventListener('message', function(event) {
      var message = event.data;
      if (message.type === 'data') {
        isEnabled = message.data.enable;
        profiles = message.data.profiles || [];
        activeProfileId = message.data.activeProfileId;
        toggle.classList.toggle('active', isEnabled);
        renderProfiles();
      }
      if (message.type === 'testResult') {
        var statusEl = document.getElementById('formStatus');
        statusEl.textContent = message.data.message;
        statusEl.className = 'status visible ' + (message.data.success ? 'success' : 'error');
      }
    });
  </script>
</body>
</html>`;
  }
}