import { MarkdownView, Notice, Plugin, TFile, requestUrl } from 'obsidian'

import { GameSearchModal } from './views/GameSearchModal'
import { GameSuggestModal } from './views/GameSuggestModal'
import { CursorJumper } from './utils/CursorJumper'
import { Game, IGDBTokenData } from './models/game.model'
import {
  GameSearchSettingTab,
  GameSearchPluginSettings,
  DEFAULT_SETTINGS,
} from './settings/settings'
import {
  getTemplateContents,
  applyTemplateTransformations,
  useTemplaterPluginInFile,
  executeInlineScriptsTemplates,
} from './utils/template'
import {
  replaceVariableSyntax,
  makeFileName,
  applyDefaultFrontMatter,
  toStringFrontMatter,
} from './utils/utils'
import { IgdbApi } from './apis/IgdbApi'

export default class GameSearchPlugin extends Plugin {
  settings!: GameSearchPluginSettings
  private api: IgdbApi | null = null

  async onload() {
    await this.loadSettings()

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon('gamepad-2', 'Create new game note', () =>
      this.createNewGameNote()
    )
    ribbonIconEl.addClass('obsidian-game-search-plugin-ribbon-class')

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-game-search-modal',
      name: 'Create new game note',
      callback: () => this.createNewGameNote(),
    })

    this.addCommand({
      id: 'open-game-search-modal-to-insert',
      name: 'Insert game metadata',
      callback: () => this.insertMetadata(),
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new GameSearchSettingTab(this.app, this))

    console.log(
      `Game Search: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`
    )
  }

  getApi(): IgdbApi {
    if (
      !this.api ||
      this.api['clientId'] !== this.settings.clientId ||
      this.api['clientSecret'] !== this.settings.clientSecret
    ) {
      this.api = new IgdbApi(
        this.settings.clientId,
        this.settings.clientSecret,
        this.settings.tokenData,
        (tokenData: IGDBTokenData) => {
          this.settings.tokenData = tokenData
          this.saveSettings()
        }
      )
    }
    return this.api
  }

  showNotice(message: unknown) {
    try {
      new Notice(String(message ?? 'An error occurred'))
    } catch {
      // ignore
    }
  }

  // open modal for game search
  async searchGameMetadata(query?: string): Promise<Game> {
    const searchedGames = await this.openGameSearchModal(query)
    return await this.openGameSuggestModal(searchedGames)
  }

  async getRenderedContents(game: Game): Promise<string> {
    const {
      templateFile,
      useDefaultFrontmatter,
      defaultFrontmatterKeyType,
      enableCoverImageSave,
      coverImagePath,
    } = this.settings

    let contentBody = ''

    if (enableCoverImageSave) {
      const coverImageUrl = game.coverBigUrl || game.coverSmallUrl || game.coverUrl
      if (coverImageUrl) {
        const imageName = makeFileName(game, this.settings.fileNameFormat, 'jpg')
        game.localCoverImage = await this.downloadAndSaveImage(
          imageName,
          coverImagePath,
          coverImageUrl
        )
      }
    }

    if (templateFile) {
      const templateContents = await getTemplateContents(this.app, templateFile)
      const replacedVariable = replaceVariableSyntax(
        game,
        applyTemplateTransformations(templateContents)
      )
      contentBody += executeInlineScriptsTemplates(game, replacedVariable)
    } else {
      // Default frontmatter generation
      if (useDefaultFrontmatter) {
        const frontMatter = applyDefaultFrontMatter(game, {}, defaultFrontmatterKeyType)
        // Filter out undefined/null values and complex objects for frontmatter
        const cleanFrontMatter = Object.fromEntries(
          Object.entries(frontMatter).filter(([_, v]) => {
            if (v === undefined || v === null || v === '') return false
            // Filter out non-array objects
            if (typeof v === 'object' && !Array.isArray(v)) return false
            // Filter out arrays that contain non-primitive values
            if (Array.isArray(v) && v.some(item => typeof item === 'object' && item !== null)) return false
            return true
          })
        )
        contentBody = `---\n${toStringFrontMatter(cleanFrontMatter)}\n---\n`
      }
    }

    return contentBody
  }

  async downloadAndSaveImage(
    imageName: string,
    directory: string,
    imageUrl: string
  ): Promise<string> {
    const { enableCoverImageSave } = this.settings
    if (!enableCoverImageSave) {
      console.warn('Cover image saving is not enabled.')
      return ''
    }

    try {
      const response = await requestUrl({
        url: imageUrl,
        method: 'GET',
        headers: {
          Accept: 'image/*',
        },
      })

      if (response.status !== 200) {
        throw new Error(`Failed to download image: ${response.status}`)
      }

      const imageData = response.arrayBuffer
      const filePath = directory ? `${directory}/${imageName}` : imageName

      // Ensure directory exists
      if (directory) {
        const folderExists = await this.app.vault.adapter.exists(directory)
        if (!folderExists) {
          await this.app.vault.createFolder(directory)
        }
      }

      await this.app.vault.adapter.writeBinary(filePath, imageData)
      return filePath
    } catch (error) {
      console.error('Error downloading or saving image:', error)
      return ''
    }
  }

  async insertMetadata(): Promise<void> {
    try {
      const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
      if (!markdownView || !markdownView.file) {
        console.warn('Can not find an active markdown view')
        return
      }

      const game = await this.searchGameMetadata(markdownView.file.basename)

      if (!markdownView.editor) {
        console.warn('Can not find editor from the active markdown view')
        return
      }

      const renderedContents = await this.getRenderedContents(game)
      markdownView.editor.replaceRange(renderedContents, { line: 0, ch: 0 })
    } catch (err) {
      console.warn(err)
      this.showNotice(err)
    }
  }

  async createNewGameNote(): Promise<void> {
    // Validate API credentials
    if (!this.settings.clientId || !this.settings.clientSecret) {
      new Notice('Please configure your IGDB API credentials in settings first.')
      return
    }

    try {
      const game = await this.searchGameMetadata()
      const renderedContents = await this.getRenderedContents(game)

      // Create new file
      const fileName = makeFileName(game, this.settings.fileNameFormat)
      const folder = this.settings.folder || ''
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Ensure folder exists
      if (folder) {
        const folderExists = await this.app.vault.adapter.exists(folder)
        if (!folderExists) {
          await this.app.vault.createFolder(folder)
        }
      }

      const targetFile = await this.app.vault.create(filePath, renderedContents)

      // If using Templater plugin
      await useTemplaterPluginInFile(this.app, targetFile)
      this.openNewGameNote(targetFile)
    } catch (err) {
      console.warn(err)
      this.showNotice(err)
    }
  }

  async openNewGameNote(targetFile: TFile) {
    if (!this.settings.openPageOnCompletion) return

    const activeLeaf = this.app.workspace.getLeaf()
    if (!activeLeaf) {
      console.warn('No active leaf')
      return
    }

    await activeLeaf.openFile(targetFile, { state: { mode: 'source' } })
    activeLeaf.setEphemeralState({ rename: 'all' })
    await new CursorJumper(this.app).jumpToNextCursorLocation()
  }

  async openGameSearchModal(query = ''): Promise<Game[]> {
    return new Promise((resolve, reject) => {
      return new GameSearchModal(this, query, (error, results) => {
        return error ? reject(error) : resolve(results ?? [])
      }).open()
    })
  }

  async openGameSuggestModal(games: Game[]): Promise<Game> {
    return new Promise((resolve, reject) => {
      return new GameSuggestModal(
        this.app,
        this.settings.showCoverImageInSearch,
        games,
        (error, selectedGame) => {
          return error ? reject(error) : resolve(selectedGame!)
        }
      ).open()
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}
