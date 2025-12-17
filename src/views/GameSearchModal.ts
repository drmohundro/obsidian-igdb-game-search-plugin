import { ButtonComponent, Modal, Notice, Setting, TextComponent } from 'obsidian'
import { Game } from '../models/game.model'
import { IgdbApi } from '../apis/IgdbApi'
import type GameSearchPlugin from '../main'

export class GameSearchModal extends Modal {
  private readonly SEARCH_BUTTON_TEXT = 'Search'
  private readonly REQUESTING_BUTTON_TEXT = 'Searching...'
  private isBusy = false
  private okBtnRef?: ButtonComponent
  private api: IgdbApi

  constructor(
    private plugin: GameSearchPlugin,
    private query: string,
    private callback: (error: Error | null, result?: Game[]) => void
  ) {
    super(plugin.app)
    this.api = plugin.getApi()
  }

  setBusy(busy: boolean): void {
    this.isBusy = busy
    this.okBtnRef
      ?.setDisabled(busy)
      .setButtonText(busy ? this.REQUESTING_BUTTON_TEXT : this.SEARCH_BUTTON_TEXT)
  }

  async searchGame(): Promise<void> {
    if (!this.query) {
      new Notice('No query entered.')
      return
    }
    if (this.isBusy) return

    this.setBusy(true)
    try {
      const searchResults = await this.api.searchGames(this.query)
      if (!searchResults?.length) {
        new Notice(`No results found for "${this.query}"`)
        return
      }
      this.callback(null, searchResults)
    } catch (err) {
      this.callback(err as Error)
    } finally {
      this.setBusy(false)
      this.close()
    }
  }

  onOpen(): void {
    const { contentEl } = this
    contentEl.createEl('h2', { text: 'Search Game' })

    contentEl.createDiv({ cls: 'game-search-plugin__search-modal--input' }, (el) => {
      const textComponent = new TextComponent(el)
      textComponent
        .setValue(this.query)
        .setPlaceholder('Search by game title')
        .onChange((value) => (this.query = value))

      textComponent.inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.isComposing) {
          this.searchGame()
        }
      })

      // Focus the input
      textComponent.inputEl.focus()
    })

    new Setting(this.contentEl).addButton((btn) => {
      this.okBtnRef = btn
        .setButtonText(this.SEARCH_BUTTON_TEXT)
        .setCta()
        .onClick(() => this.searchGame())
    })
  }

  onClose(): void {
    const { contentEl } = this
    contentEl.empty()
  }
}
