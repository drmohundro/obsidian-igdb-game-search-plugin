import { requestUrl } from 'obsidian'
import { Game, IGDBGame, IGDBAuthResponse, IGDBTokenData } from '../models/game.model'

const API_URL = 'https://api.igdb.com/v4/games'
const AUTH_URL = 'https://id.twitch.tv/oauth2/token'

export class IgdbApi {
  private clientId: string
  private clientSecret: string
  private tokenData: IGDBTokenData | null = null
  private onTokenUpdate?: (token: IGDBTokenData) => void

  constructor(
    clientId: string,
    clientSecret: string,
    tokenData?: IGDBTokenData,
    onTokenUpdate?: (token: IGDBTokenData) => void
  ) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.tokenData = tokenData || null
    this.onTokenUpdate = onTokenUpdate
  }

  private isTokenValid(): boolean {
    if (!this.tokenData) return false
    // Check if token expires in less than 5 minutes
    return this.tokenData.expiresAt > Date.now() + 5 * 60 * 1000
  }

  async authenticate(): Promise<string> {
    if (this.isTokenValid() && this.tokenData) {
      return this.tokenData.accessToken
    }

    const url = new URL(AUTH_URL)
    url.searchParams.append('client_id', this.clientId)
    url.searchParams.append('client_secret', this.clientSecret)
    url.searchParams.append('grant_type', 'client_credentials')

    const response = await requestUrl({
      url: url.href,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const authResponse: IGDBAuthResponse = response.json

    if (!authResponse.access_token) {
      throw new Error('Failed to authenticate with IGDB')
    }

    this.tokenData = {
      accessToken: authResponse.access_token,
      expiresAt: Date.now() + authResponse.expires_in * 1000,
    }

    if (this.onTokenUpdate) {
      this.onTokenUpdate(this.tokenData)
    }

    return this.tokenData.accessToken
  }

  async searchGames(query: string, limit = 15): Promise<Game[]> {
    const token = await this.authenticate()

    const body = `
      fields name, slug, first_release_date,
        cover.url,
        genres.name,
        game_modes.name,
        platforms.name, platforms.abbreviation,
        involved_companies.developer, involved_companies.publisher,
        involved_companies.company.name, involved_companies.company.logo.url,
        summary, storyline,
        rating, rating_count,
        aggregated_rating, aggregated_rating_count,
        url, websites.url, websites.category;
      search "${query}";
      limit ${limit};
    `

    try {
      const response = await requestUrl({
        url: API_URL,
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
        body: body,
      })

      const games: IGDBGame[] = response.json

      // Check for error response (e.g., invalid token)
      if ((games as unknown as { message?: string }).message) {
        // Token might be invalid, refresh and retry
        this.tokenData = null
        return this.searchGames(query, limit)
      }

      return games.map((game) => this.mapToGame(game))
    } catch (error) {
      // If request fails, try refreshing token once
      if (this.tokenData) {
        this.tokenData = null
        return this.searchGames(query, limit)
      }
      throw error
    }
  }

  private mapToGame(igdbGame: IGDBGame): Game {
    const developers =
      igdbGame.involved_companies?.filter((ic) => ic.developer).map((ic) => ic.company.name) || []

    const publishers =
      igdbGame.involved_companies?.filter((ic) => ic.publisher).map((ic) => ic.company.name) || []

    const developerCompany = igdbGame.involved_companies?.find((ic) => ic.developer)
    const developerLogo = developerCompany?.company.logo?.url
      ? 'https:' + developerCompany.company.logo.url.replace('t_thumb', 't_logo_med')
      : undefined

    const genres = igdbGame.genres?.map((g) => g.name) || []
    const gameModes = igdbGame.game_modes?.map((gm) => gm.name) || []
    const platforms = igdbGame.platforms?.map((p) => p.abbreviation || p.name) || []

    let releaseDate: string | undefined
    let releaseYear: number | undefined
    if (igdbGame.first_release_date) {
      const date = new Date(igdbGame.first_release_date * 1000)
      releaseYear = date.getFullYear()
      releaseDate = date.toISOString().split('T')[0] // YYYY-MM-DD
    }

    // Process cover URLs - IGDB returns URLs starting with //
    let coverUrl: string | undefined
    let coverSmallUrl: string | undefined
    let coverBigUrl: string | undefined
    if (igdbGame.cover?.url) {
      const baseUrl = 'https:' + igdbGame.cover.url
      coverUrl = baseUrl
      coverSmallUrl = baseUrl.replace('t_thumb', 't_cover_small')
      coverBigUrl = baseUrl.replace('t_thumb', 't_cover_big')
    }

    // Find official website
    const officialWebsite = igdbGame.websites?.find((w) => w.category === 1)

    return {
      id: igdbGame.id,
      name: igdbGame.name,
      slug: igdbGame.slug,
      releaseDate,
      releaseYear,
      developer: developers[0],
      developers,
      publisher: publishers[0],
      publishers,
      developerLogo,
      genres,
      genresFormatted: this.formatList(genres),
      gameModes,
      gameModesFormatted: this.formatList(gameModes),
      platforms,
      platformsFormatted: this.formatList(platforms),
      coverUrl,
      coverSmallUrl,
      coverBigUrl,
      summary: igdbGame.summary,
      storyline: igdbGame.storyline,
      rating: igdbGame.rating ? Math.round(igdbGame.rating) : undefined,
      ratingCount: igdbGame.rating_count,
      aggregatedRating: igdbGame.aggregated_rating
        ? Math.round(igdbGame.aggregated_rating)
        : undefined,
      aggregatedRatingCount: igdbGame.aggregated_rating_count,
      url: igdbGame.url,
      websiteUrl: officialWebsite?.url,
    }
  }

  private formatList(items: string[]): string {
    if (items.length === 0) return ''
    if (items.length === 1) return items[0]
    return items.map((item) => `"${item}"`).join(', ')
  }
}
