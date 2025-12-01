import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { WebviewRenderer } from '../../infrastructure/renderers/WebviewRenderer';

// Mock vscode
vi.mock('vscode', () => {
  const ColorThemeKind = {
    Light: 1,
    Dark: 2,
    HighContrast: 3,
  };

  return {
    Uri: {
      joinPath: vi.fn().mockReturnValue({ toString: () => 'mock-uri' }),
      file: vi.fn(),
    },
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn((_key, defaultValue) => defaultValue),
      }),
    },
    window: {
      activeColorTheme: {
        kind: ColorThemeKind.Light,
      },
    },
    ColorThemeKind: ColorThemeKind,
  };
});

describe('WebviewRenderer Test Suite', () => {
  const renderer = new WebviewRenderer();
  const mockWebview = {
    asWebviewUri: vi.fn((uri) => uri),
    html: '',
    options: {},
    cspSource: '',
    onDidReceiveMessage: vi.fn(),
    postMessage: vi.fn(),
  } as unknown as vscode.Webview;

  const mockExtensionUri = {
    scheme: 'file',
    authority: '',
    path: '/mock/extension',
    query: '',
    fragment: '',
    fsPath: '/mock/extension',
    with: vi.fn(),
    toString: () => 'file:///mock/extension',
    toJSON: () => ({}),
  } as vscode.Uri;

  it('should generate valid HTML', () => {
    const code = 'graph TD\nA-->B';
    const html = renderer.render(mockWebview, code, mockExtensionUri);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Mermaid Preview</title>');
    expect(html).toContain('graph TD');
    // Mermaid code is escaped in HTML
    expect(html).toContain('A--&gt;B');
  });

  it('should escape HTML characters in mermaid code', () => {
    const code = 'graph TD\nA["Node <with> & \'quotes\'"]';
    const html = renderer.render(mockWebview, code, mockExtensionUri);

    expect(html).toContain('&amp;'); // &
    expect(html).toContain('&lt;'); // <
    expect(html).toContain('&gt;'); // >
    expect(html).toContain('&#039;'); // '
    expect(html).toContain('&quot;'); // "
  });

  it('should include correct theme configuration for light mode', () => {
    // Mock is set to Light mode by default
    const code = 'graph TD';
    const html = renderer.render(mockWebview, code, mockExtensionUri);

    // JSON.stringify output format
    expect(html).toContain('"darkMode":false');
    expect(html).toContain('"theme":"base"');
  });

  it('should adapt to dark mode', () => {
    // Change mock to Dark mode
    vi.mocked(vscode.window).activeColorTheme = { kind: 2 } as any; // Dark

    const code = 'graph TD';
    const html = renderer.render(mockWebview, code, mockExtensionUri);

    // JSON.stringify output format
    expect(html).toContain('"darkMode":true');
    expect(html).toContain('"theme":"dark"');
  });
});
