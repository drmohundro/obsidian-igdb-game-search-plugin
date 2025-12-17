import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type GameSearchPlugin from '../main';
import { FolderSuggest } from './suggesters/FolderSuggester';
import { FileSuggest } from './suggesters/FileSuggester';
import { IGDBTokenData } from '../models/game.model';

export enum DefaultFrontmatterKeyType {
  snakeCase = 'Snake Case',
  camelCase = 'Camel Case',
}

export interface GameSearchPluginSettings {
  // File settings
  folder: string;
  fileNameFormat: string;
  templateFile: string;

  // IGDB API settings
  clientId: string;
  clientSecret: string;
  tokenData?: IGDBTokenData;

  // Frontmatter settings
  useDefaultFrontmatter: boolean;
  defaultFrontmatterKeyType: DefaultFrontmatterKeyType;

  // UI settings
  openPageOnCompletion: boolean;
  showCoverImageInSearch: boolean;

  // Cover image settings
  enableCoverImageSave: boolean;
  coverImagePath: string;
}

export const DEFAULT_SETTINGS: GameSearchPluginSettings = {
  folder: '',
  fileNameFormat: '{{name}}',
  templateFile: '',
  clientId: '',
  clientSecret: '',
  tokenData: undefined,
  useDefaultFrontmatter: true,
  defaultFrontmatterKeyType: DefaultFrontmatterKeyType.camelCase,
  openPageOnCompletion: true,
  showCoverImageInSearch: true,
  enableCoverImageSave: false,
  coverImagePath: '',
};

export class GameSearchSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: GameSearchPlugin
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('game-search-plugin__settings');

    // General Settings
    this.createHeader('General Settings', containerEl);
    this.createFileLocationSetting(containerEl);
    this.createFileNameFormatSetting(containerEl);
    this.createTemplateFileSetting(containerEl);

    // IGDB API Settings
    this.createHeader('IGDB API Settings', containerEl);
    this.createApiDescription(containerEl);
    this.createClientIdSetting(containerEl);
    this.createClientSecretSetting(containerEl);
    this.createApiTestSetting(containerEl);

    // UI Settings
    this.createHeader('UI Settings', containerEl);
    this.createOpenPageSetting(containerEl);
    this.createShowCoverImageSetting(containerEl);

    // Cover Image Settings
    this.createHeader('Cover Image Settings', containerEl);
    this.createEnableCoverImageSaveSetting(containerEl);
    this.createCoverImagePathSetting(containerEl);
  }

  private createHeader(title: string, containerEl: HTMLElement): Setting {
    const header = document.createDocumentFragment();
    header.createEl('h2', { text: title });
    return new Setting(containerEl).setHeading().setName(header);
  }

  private createFileLocationSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('New file location')
      .setDesc('New game notes will be placed here.')
      .addSearch(cb => {
        try {
          new FolderSuggest(this.app, cb.inputEl);
        } catch (e) {
          console.error(e);
        }
        cb.setPlaceholder('Example: Games')
          .setValue(this.plugin.settings.folder)
          .onChange(newFolder => {
            this.plugin.settings.folder = newFolder;
            this.plugin.saveSettings();
          });
      });
  }

  private createFileNameFormatSetting(containerEl: HTMLElement): void {
    const desc = document.createDocumentFragment();
    desc.createDiv({
      text: 'Available variables: {{name}}, {{developer}}, {{releaseYear}}, {{DATE}}',
    });

    new Setting(containerEl)
      .setName('New file name')
      .setDesc(desc)
      .addText(cb => {
        cb.setPlaceholder('Example: {{name}} ({{releaseYear}})')
          .setValue(this.plugin.settings.fileNameFormat)
          .onChange(newValue => {
            this.plugin.settings.fileNameFormat = newValue?.trim();
            this.plugin.saveSettings();
          });
      });
  }

  private createTemplateFileSetting(containerEl: HTMLElement): void {
    const desc = document.createDocumentFragment();
    desc.createDiv({ text: 'Select a template file for new game notes.' });
    desc.createEl('a', {
      text: 'Template documentation',
      href: 'https://github.com/your-repo/obsidian-game-search-plugin#templates',
    });

    new Setting(containerEl)
      .setName('Template file')
      .setDesc(desc)
      .addSearch(cb => {
        try {
          new FileSuggest(this.app, cb.inputEl);
        } catch (e) {
          console.error(e);
        }
        cb.setPlaceholder('Example: templates/game-template')
          .setValue(this.plugin.settings.templateFile)
          .onChange(newTemplateFile => {
            this.plugin.settings.templateFile = newTemplateFile;
            this.plugin.saveSettings();
          });
      });
  }

  private createApiDescription(containerEl: HTMLElement): void {
    const desc = document.createDocumentFragment();
    desc.createDiv({
      text: 'To use this plugin, you need IGDB API credentials from Twitch.',
    });
    desc.createEl('br');
    desc.createEl('a', {
      text: '1. Go to Twitch Developer Console',
      href: 'https://dev.twitch.tv/console',
    });
    desc.createEl('br');
    desc.createDiv({ text: '2. Create a new application' });
    desc.createDiv({ text: '3. Copy your Client ID and generate a Client Secret' });

    new Setting(containerEl).setName('Setup Instructions').setDesc(desc);
  }

  private createClientIdSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Client ID')
      .setDesc('Your Twitch/IGDB Client ID')
      .addText(text => {
        text
          .setPlaceholder('Enter Client ID')
          .setValue(this.plugin.settings.clientId)
          .onChange(async value => {
            this.plugin.settings.clientId = value.trim();
            await this.plugin.saveSettings();
          });
      });
  }

  private createClientSecretSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Client Secret')
      .setDesc('Your Twitch/IGDB Client Secret (stored locally)')
      .addText(text => {
        text.inputEl.type = 'password';
        text
          .setPlaceholder('Enter Client Secret')
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async value => {
            this.plugin.settings.clientSecret = value.trim();
            // Clear cached token when credentials change
            this.plugin.settings.tokenData = undefined;
            await this.plugin.saveSettings();
          });
      });
  }

  private createApiTestSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Test API Connection')
      .setDesc('Verify your API credentials are working')
      .addButton(button => {
        button.setButtonText('Test Connection').onClick(async () => {
          if (!this.plugin.settings.clientId || !this.plugin.settings.clientSecret) {
            new Notice('Please enter both Client ID and Client Secret first.');
            return;
          }

          button.setDisabled(true);
          button.setButtonText('Testing...');

          try {
            const api = this.plugin.getApi();
            await api.authenticate();
            new Notice('API connection successful!');
          } catch (error) {
            new Notice(`API connection failed: ${error}`);
          } finally {
            button.setDisabled(false);
            button.setButtonText('Test Connection');
          }
        });
      });
  }

  private createOpenPageSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Open new game note')
      .setDesc('Automatically open the note after creation.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.openPageOnCompletion).onChange(async value => {
          this.plugin.settings.openPageOnCompletion = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private createShowCoverImageSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Show cover images in search')
      .setDesc('Display cover images in search results.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showCoverImageInSearch).onChange(async value => {
          this.plugin.settings.showCoverImageInSearch = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private createEnableCoverImageSaveSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Save cover images locally')
      .setDesc('Download and save cover images to your vault.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableCoverImageSave).onChange(async value => {
          this.plugin.settings.enableCoverImageSave = value;
          await this.plugin.saveSettings();
        })
      );
  }

  private createCoverImagePathSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Cover image path')
      .setDesc('Where to save downloaded cover images.')
      .addSearch(cb => {
        try {
          new FolderSuggest(this.app, cb.inputEl);
        } catch (e) {
          console.error(e);
        }
        cb.setPlaceholder('Example: Assets/GameCovers')
          .setValue(this.plugin.settings.coverImagePath)
          .onChange(async value => {
            this.plugin.settings.coverImagePath = value.trim();
            await this.plugin.saveSettings();
          });
      });
  }
}
