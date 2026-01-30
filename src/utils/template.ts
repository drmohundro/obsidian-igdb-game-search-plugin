import { Game } from '../models/game.model';
import { App, normalizePath, Notice, TFile } from 'obsidian';

export async function getTemplateContents(
  app: App,
  templatePath: string | undefined
): Promise<string> {
  const { metadataCache, vault } = app;
  const normalizedTemplatePath = normalizePath(templatePath ?? '');

  if (templatePath === '/' || !templatePath) {
    return '';
  }

  try {
    const templateFile = metadataCache.getFirstLinkpathDest(normalizedTemplatePath, '');
    return templateFile ? vault.cachedRead(templateFile) : '';
  } catch (err) {
    console.error(`Failed to read template file '${normalizedTemplatePath}'`, err);
    new Notice('Failed to read template file');
    return '';
  }
}

export function applyTemplateTransformations(rawTemplateContents: string): string {
  return rawTemplateContents.replace(
    /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
    (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
      const now = window.moment();
      const currentDate = window.moment().clone().set({
        hour: now.get('hour'),
        minute: now.get('minute'),
        second: now.get('second'),
      });

      if (calc) {
        currentDate.add(parseInt(timeDelta, 10), unit);
      }

      if (momentFormat) {
        return currentDate.format(momentFormat.substring(1).trim());
      }
      return currentDate.format('YYYY-MM-DD');
    }
  );
}

export function executeInlineScriptsTemplates(game: Game, text: string): string {
  const commandRegex = /<%(?:=)(.+)%>/g;
  const matchedList = [...text.matchAll(commandRegex)];

  return matchedList.reduce((result, [matched, script]) => {
    try {
      const outputs = evaluateTemplateExpression(script, game);
      return result.replace(matched, outputs);
    } catch (err) {
      console.warn('Template script error:', err);
    }
    return result;
  }, text);
}

function evaluateTemplateExpression(script: string, game: Game): string {
  // Evaluate simple property access patterns without Function constructor
  // Supports: game.property, game.property.join(', ')
  const trimmedScript = script.trim();

  // Support simple property access: game.property
  const simplePropertyMatch = trimmedScript.match(/^game\.(\w+)$/);
  if (simplePropertyMatch) {
    const prop = simplePropertyMatch[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic property access for template evaluation
    const value = (game as any)[prop];
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  // Support array join: game.property.join(', ') or game.property.join(", ")
  const joinMatch = trimmedScript.match(/^game\.(\w+)\.join\(['"](.+?)['"]\)$/);
  if (joinMatch) {
    const prop = joinMatch[1];
    const separator = joinMatch[2];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic property access for template evaluation
    const value = (game as any)[prop];
    if (Array.isArray(value)) {
      return value.join(separator);
    }
  }

  // For unsupported expressions, return empty string with warning
  console.warn('Template expression not supported (limited to simple property access and join):', trimmedScript);
  return '';
}

export async function useTemplaterPluginInFile(app: App, file: TFile): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Templater plugin API is not exposed in Obsidian types
  const templater = (app as any).plugins.plugins['templater-obsidian'];
  if (templater && !templater?.settings['trigger_on_file_creation']) {
    await templater.templater.overwrite_file_commands(file);
  }
}
