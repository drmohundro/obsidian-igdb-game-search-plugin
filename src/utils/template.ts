import { Game } from '../models/game.model';
import { App, normalizePath, Notice, TFile } from 'obsidian';
// Duration unit type for moment.js (bundled with Obsidian)
type DurationUnit = 'y' | 'Q' | 'M' | 'w' | 'd' | 'h' | 's' | 'ms';

// Templater plugin API interface
interface TemplaterPlugin {
  settings: { trigger_on_file_creation: boolean };
  templater: {
    overwrite_file_commands(file: TFile): Promise<void>;
  };
}

interface AppWithPlugins extends App {
  plugins: {
    plugins: Record<string, TemplaterPlugin | undefined>;
  };
}

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
    (
      _match: string,
      _timeOrDate: string,
      calc: string | undefined,
      timeDelta: string | undefined,
      unit: DurationUnit | undefined,
      momentFormat: string | undefined
    ) => {
      const now = window.moment();
      const currentDate = window
        .moment()
        .clone()
        .set({
          hour: now.get('hour'),
          minute: now.get('minute'),
          second: now.get('second'),
        });

      if (calc && timeDelta && unit) {
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
    const prop = simplePropertyMatch[1] as keyof Game;
    if (prop in game) {
      const value = game[prop];
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
  }

  // Support array join: game.property.join(', ') or game.property.join(", ")
  const joinMatch = trimmedScript.match(/^game\.(\w+)\.join\(['"](.+?)['"]\)$/);
  if (joinMatch) {
    const prop = joinMatch[1] as keyof Game;
    const separator = joinMatch[2];
    if (prop in game) {
      const value = game[prop];
      if (Array.isArray(value)) {
        return value.join(separator);
      }
    }
  }

  // For unsupported expressions, return empty string with warning
  console.warn(
    'Template expression not supported (limited to simple property access and join):',
    trimmedScript
  );
  return '';
}

export async function useTemplaterPluginInFile(app: App, file: TFile): Promise<void> {
  const templater = (app as AppWithPlugins).plugins.plugins['templater-obsidian'];
  if (templater && !templater.settings.trigger_on_file_creation) {
    await templater.templater.overwrite_file_commands(file);
  }
}
