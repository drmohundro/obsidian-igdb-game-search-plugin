import { Game } from '../models/game.model';
import { DefaultFrontmatterKeyType } from '../settings/settings';

// == Format Syntax == //
export const NUMBER_REGEX = /^-?[0-9]*$/;
export const DATE_REGEX = /{{DATE(\+-?[0-9]+)?}}/;
export const DATE_REGEX_FORMATTED = /{{DATE:([^}\n\r+]*)(\+-?[0-9]+)?}}/;

export function replaceIllegalFileNameCharactersInString(text: string): string {
  return text.replace(/[\\,#%&{}/*<>$":@.?|]/g, '').replace(/\s+/g, ' ');
}

export function makeFileName(game: Game, fileNameFormat?: string, extension = 'md'): string {
  let result: string;
  if (fileNameFormat) {
    result = replaceVariableSyntax(game, replaceDateInString(fileNameFormat));
  } else {
    result = game.developer ? `${game.name} - ${game.developer}` : game.name;
  }
  return replaceIllegalFileNameCharactersInString(result) + `.${extension}`;
}

export function replaceVariableSyntax(game: Game, text: string): string {
  if (!text?.trim()) {
    return '';
  }

  const entries = Object.entries(game);

  return entries
    .reduce((result, [key, val]) => {
      // Handle null/undefined as empty string
      if (val === null || val === undefined) {
        return result.replace(new RegExp(`{{${key}}}`, 'ig'), '');
      }
      const value = Array.isArray(val) ? val.join(', ') : String(val);
      return result.replace(new RegExp(`{{${key}}}`, 'ig'), value);
    }, text)
    .replace(/{{\w+}}/gi, '')
    .trim();
}

export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter?.toLowerCase()}`);
}

export function changeSnakeCase(game: Game): Record<string, unknown> {
  return Object.entries(game).reduce(
    (acc, [key, value]) => {
      acc[camelToSnakeCase(key)] = value;
      return acc;
    },
    {} as Record<string, unknown>
  );
}

export function applyDefaultFrontMatter(
  game: Game,
  frontmatter: Record<string, unknown> | string,
  keyType: DefaultFrontmatterKeyType = DefaultFrontmatterKeyType.snakeCase
): Record<string, unknown> {
  const frontMatter =
    keyType === DefaultFrontmatterKeyType.camelCase
      ? ({ ...game } as Record<string, unknown>)
      : changeSnakeCase(game);

  const extraFrontMatter =
    typeof frontmatter === 'string' ? parseFrontMatter(frontmatter) : frontmatter;

  for (const key in extraFrontMatter) {
    const value = String(extraFrontMatter[key] ?? '').trim();
    if (frontMatter[key] && frontMatter[key] !== value) {
      frontMatter[key] = `${frontMatter[key]}, ${value}`;
    } else {
      frontMatter[key] = value;
    }
  }

  return frontMatter;
}

export function parseFrontMatter(frontMatterString: string): Record<string, string> {
  if (!frontMatterString) return {};
  return frontMatterString
    .split('\n')
    .map(item => {
      const index = item.indexOf(':');
      if (index === -1) return [item.trim(), ''];

      const key = item.slice(0, index)?.trim();
      const value = item.slice(index + 1)?.trim();
      return [key, value];
    })
    .reduce(
      (acc, [key, value]) => {
        if (key) {
          acc[key] = value?.trim() ?? '';
        }
        return acc;
      },
      {} as Record<string, string>
    );
}

export function toStringFrontMatter(frontMatter: Record<string, unknown>): string {
  return Object.entries(frontMatter)
    .map(([key, value]) => {
      if (value === undefined || value === null) return '';

      if (Array.isArray(value)) {
        // Filter out non-primitive values and format as YAML array
        const primitives = value.filter(v => typeof v !== 'object' || v === null);
        if (primitives.length === 0) return '';
        const escaped = primitives.map(v => {
          const str = String(v);
          // Escape quotes and wrap in quotes
          return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
        });
        return `${key}: [${escaped.join(', ')}]`;
      }

      const stringValue = String(value).trim();
      if (!stringValue) return '';
      if (/\r|\n/.test(stringValue)) return '';
      if (/:\s/.test(stringValue) || /["']/.test(stringValue)) {
        return `${key}: "${stringValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
      return `${key}: ${stringValue}`;
    })
    .filter(line => line)
    .join('\n');
}

export function getDate(input?: { format?: string; offset?: number }): string {
  let duration;

  if (input?.offset !== null && input?.offset !== undefined && typeof input.offset === 'number') {
    duration = window.moment.duration(input.offset, 'days');
  }

  return input?.format
    ? window.moment().add(duration).format(input?.format)
    : window.moment().add(duration).format('YYYY-MM-DD');
}

export function replaceDateInString(input: string): string {
  let output: string = input;

  while (DATE_REGEX.test(output)) {
    const dateMatch = DATE_REGEX.exec(output);
    let offset = 0;

    if (dateMatch?.[1]) {
      const offsetString = dateMatch[1].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }
    output = replacer(output, DATE_REGEX, getDate({ offset }));
  }

  while (DATE_REGEX_FORMATTED.test(output)) {
    const dateMatch = DATE_REGEX_FORMATTED.exec(output);
    const format = dateMatch?.[1];
    let offset = 0;

    if (dateMatch?.[2]) {
      const offsetString = dateMatch[2].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }

    output = replacer(output, DATE_REGEX_FORMATTED, getDate({ format, offset }));
  }

  return output;
}

function replacer(str: string, reg: RegExp, replaceValue: string): string {
  return str.replace(reg, () => replaceValue);
}
