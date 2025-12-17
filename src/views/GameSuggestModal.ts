import { App, SuggestModal } from 'obsidian';
import { Game } from '../models/game.model';

export class GameSuggestModal extends SuggestModal<Game> {
  showCoverImageInSearch: boolean;

  constructor(
    app: App,
    showCoverImageInSearch: boolean,
    private readonly suggestion: Game[],
    private onChoose: (error: Error | null, result?: Game) => void
  ) {
    super(app);
    this.showCoverImageInSearch = showCoverImageInSearch;
  }

  // Returns all available suggestions.
  getSuggestions(query: string): Game[] {
    return this.suggestion.filter(game => {
      const searchQuery = query?.toLowerCase();
      return (
        game.name?.toLowerCase().includes(searchQuery) ||
        game.developer?.toLowerCase().includes(searchQuery) ||
        game.genres?.some(g => g.toLowerCase().includes(searchQuery))
      );
    });
  }

  // Renders each suggestion item.
  renderSuggestion(game: Game, el: HTMLElement) {
    el.addClass('game-suggestion-item');

    const coverImageUrl = game.coverBigUrl || game.coverSmallUrl || game.coverUrl;

    if (this.showCoverImageInSearch && coverImageUrl) {
      el.createEl('img', {
        cls: 'game-cover-image',
        attr: {
          src: coverImageUrl,
          alt: `Cover for ${game.name}`,
        },
      });
    }

    const textContainer = el.createEl('div', { cls: 'game-text-info' });
    textContainer.createEl('div', { cls: 'game-title', text: game.name });

    const details: string[] = [];
    if (game.releaseYear) details.push(`(${game.releaseYear})`);
    if (game.developer) details.push(game.developer);
    if (game.genres?.length) details.push(game.genres.slice(0, 2).join(', '));

    if (details.length > 0) {
      textContainer.createEl('small', {
        cls: 'game-details',
        text: details.join(' · '),
      });
    }

    if (game.platforms?.length) {
      textContainer.createEl('small', {
        cls: 'game-platforms',
        text: game.platforms.slice(0, 5).join(', '),
      });
    }
  }

  // Perform action on the selected suggestion.
  onChooseSuggestion(game: Game) {
    this.onChoose(null, game);
  }
}
