// Simplified suggest component without @popperjs/core dependency
import { App, ISuggestOwner, Scope } from 'obsidian';

const wrapAround = (value: number, size: number): number => {
  return ((value % size) + size) % size;
};

class Suggest<T> {
  private owner: ISuggestOwner<T>;
  private values: T[] = [];
  private suggestions: HTMLDivElement[] = [];
  private selectedItem = 0;
  private containerEl: HTMLElement;

  constructor(owner: ISuggestOwner<T>, containerEl: HTMLElement, scope: Scope) {
    this.owner = owner;
    this.containerEl = containerEl;

    containerEl.on('click', '.suggestion-item', this.onSuggestionClick.bind(this) as (this: HTMLElement, ev: MouseEvent, delegateTarget: HTMLElement) => void);
    containerEl.on('mousemove', '.suggestion-item', this.onSuggestionMouseover.bind(this) as (this: HTMLElement, ev: MouseEvent, delegateTarget: HTMLElement) => void);

    scope.register([], 'ArrowUp', event => {
      if (!event.isComposing) {
        this.setSelectedItem(this.selectedItem - 1, true);
        return false;
      }
    });

    scope.register([], 'ArrowDown', event => {
      if (!event.isComposing) {
        this.setSelectedItem(this.selectedItem + 1, true);
        return false;
      }
    });

    scope.register([], 'Enter', event => {
      if (!event.isComposing) {
        this.useSelectedItem(event);
        return false;
      }
    });
  }

  onSuggestionClick(event: MouseEvent, el: HTMLElement): void {
    event.preventDefault();
    const item = this.suggestions.indexOf(el as HTMLDivElement);
    this.setSelectedItem(item, false);
    this.useSelectedItem(event);
  }

  onSuggestionMouseover(_event: MouseEvent, el: HTMLElement): void {
    const item = this.suggestions.indexOf(el as HTMLDivElement);
    this.setSelectedItem(item, false);
  }

  setSuggestions(values: T[]) {
    this.containerEl.empty();
    const suggestionEls: HTMLDivElement[] = [];

    values.forEach(value => {
      const suggestionEl = this.containerEl.createDiv('suggestion-item');
      this.owner.renderSuggestion(value, suggestionEl);
      suggestionEls.push(suggestionEl);
    });

    this.values = values;
    this.suggestions = suggestionEls;
    this.setSelectedItem(0, false);
  }

  useSelectedItem(event: MouseEvent | KeyboardEvent) {
    const currentValue = this.values[this.selectedItem];
    if (currentValue) {
      this.owner.selectSuggestion(currentValue, event);
    }
  }

  setSelectedItem(selectedIndex: number, scrollIntoView: boolean) {
    const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);
    const prevSelectedSuggestion = this.suggestions[this.selectedItem];
    const selectedSuggestion = this.suggestions[normalizedIndex];

    prevSelectedSuggestion?.removeClass('is-selected');
    selectedSuggestion?.addClass('is-selected');

    this.selectedItem = normalizedIndex;

    if (scrollIntoView) {
      selectedSuggestion?.scrollIntoView({ block: 'nearest' });
    }
  }
}

export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
  private scope: Scope;
  private suggestEl: HTMLElement;
  private suggest: Suggest<T>;

  constructor(
    protected app: App,
    protected inputEl: HTMLInputElement | HTMLTextAreaElement
  ) {
    this.scope = new Scope();

    this.suggestEl = createDiv('suggestion-container');
    this.suggestEl.style.position = 'absolute';
    this.suggestEl.style.zIndex = '1000';

    const suggestion = this.suggestEl.createDiv('suggestion');
    this.suggest = new Suggest(this, suggestion, this.scope);

    this.scope.register([], 'Escape', this.close.bind(this));

    this.inputEl.addEventListener('input', this.onInputChanged.bind(this));
    this.inputEl.addEventListener('focus', this.onInputChanged.bind(this));
    this.inputEl.addEventListener('blur', () => {
      // Delay close to allow click events on suggestions
      setTimeout(() => this.close(), 150);
    });
    this.suggestEl.on('mousedown', '.suggestion-container', (event: MouseEvent) => {
      event.preventDefault();
    });
  }

  onInputChanged(): void {
    const inputStr = this.inputEl.value;
    const suggestions = this.getSuggestions(inputStr);

    if (!suggestions) {
      this.close();
      return;
    }

    if (suggestions.length > 0) {
      this.suggest.setSuggestions(suggestions);
      this.open();
    } else {
      this.close();
    }
  }

  open(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.app as any).keymap.pushScope(this.scope);

    // Position the suggest container below the input
    const rect = this.inputEl.getBoundingClientRect();
    this.suggestEl.style.top = `${rect.bottom + window.scrollY}px`;
    this.suggestEl.style.left = `${rect.left + window.scrollX}px`;
    this.suggestEl.style.width = `${rect.width}px`;

    document.body.appendChild(this.suggestEl);
  }

  close(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.app as any).keymap.popScope(this.scope);

    this.suggest.setSuggestions([]);
    this.suggestEl.detach();
  }

  abstract getSuggestions(inputStr: string): T[];
  abstract renderSuggestion(item: T, el: HTMLElement): void;
  abstract selectSuggestion(item: T): void;
}
