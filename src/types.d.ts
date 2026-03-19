declare module 'ikman-api-client' {
  export type SortBy = 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc' | 'relevance';

  export interface SearchAd {
    id: string | null;
    title: string;
    price: string | null;
    price_raw: unknown;
    price_numeric: number;
    location: string;
    area: string | null;
    district: string | null;
    link: string | null;
    postedTime: string | null;
    postedDate: string | null;
    category: string | null;
    category_id: number | null;
    seller_type: string | null;
    ad_type: string | null;
    is_urgent: boolean;
    is_featured: boolean;
    has_images: boolean;
    canonical_title?: string | null;
    canonical_location?: string | null;
    canonical_price?: number | null;
    canonical_key?: string;
    [key: string]: unknown;
  }

  export interface DetailedAd {
    id: string;
    title: string;
    description: string;
    url: string;
    slug: string;
    type: string;
    price: string | null;
    price_raw: string | null;
    price_numeric: number | null;
    negotiable: boolean;
    location: string;
    city: string | null;
    district: string | null;
    location_id: number | null;
    district_id: number | null;
    category: string | null;
    category_slug: string | null;
    category_id: number | null;
    parent_category: string | null;
    parent_category_id: number | null;
    posted_date: string | null;
    posted_at: string | null;
    expires_at: string | null;
    posted_timestamp: number | null;
    views: number;
    seller: {
      id: string | null;
      name: string | null;
      is_member: boolean;
      is_verified: boolean;
      is_featured: boolean;
      membership_level: string | null;
      member_since: string | null;
      shop: {
        id: string;
        name: string;
        slug: string;
        logo: string;
        email?: string;
      } | null;
    };
    contact: {
      phone_numbers: Array<{
        number: string;
        verified: boolean;
      }>;
      chat_enabled: boolean;
      email?: string;
    };
    images: string[];
    main_image: string | null;
    image_count: number;
    is_promoted: boolean;
    is_doorstep_delivery: boolean;
    is_safe_buy: boolean;
    similar_ads: Array<{
      id: string;
      title: string;
      price: string;
      price_numeric: number | null;
      location: string;
      url: string;
      image: string | null;
      category?: string;
      posted_time?: string;
    }>;
    _raw?: unknown;
    [key: string]: unknown;
  }

  export interface SearchPluginContext {
    keyword: string;
    options: SearchOptions;
    mode: 'search' | 'searchPages';
    page?: number;
  }

  export interface SearchPlugin {
    name?: string;
    transformAd?: (ad: SearchAd, context: SearchPluginContext) => SearchAd | void;
    transformResults?: (ads: SearchAd[], context: SearchPluginContext) => SearchAd[] | void;
  }

  export interface SearchOptions {
    maxPages?: number;
    respectAccessLimit?: boolean;
    headless?: boolean;
    timeout?: number;
    retries?: number;
    sortBy?: SortBy;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    category?: string;
    dedupe?: boolean;
    plugins?: SearchPlugin[];
    cache?: boolean;
    cacheDir?: string;
    cacheTTL?: number;
    saveToFile?: boolean;
    fileName?: string;
    verbose?: boolean;
    includeRaw?: boolean;
    delay?: {
      min?: number;
      max?: number;
    };
  }

  export interface AdPageOptions {
    timeout?: number;
    verbose?: boolean;
    includeRaw?: boolean;
    retries?: number;
  }

  export interface BatchOptions {
    concurrency?: number;
    delay?: number;
    saveToFile?: boolean;
    fileName?: string;
    verbose?: boolean;
  }

  export interface BatchResult {
    results: DetailedAd[];
    errors: Array<{
      url: string;
      index: number;
      error: string;
      timestamp: string;
    }>;
    stats: {
      total: number;
      successful: number;
      failed: number;
      success_rate: string;
      time_taken: string;
      errors_by_type: Record<string, number>;
    };
  }

  export interface SearchSummary {
    keyword: string;
    sort_by: SortBy;
    total_count: number;
    accessible_count: number;
    is_capped: boolean;
    access_limit: number;
    page_size: number;
    max_accessible_pages: number;
  }

  export class Cache {
    constructor(options?: { cache?: boolean; cacheDir?: string; cacheTTL?: number });
    cacheDir: string;
    enabled: boolean;
    ttl: number;
    generateKey(keyword: string, options?: Partial<SearchOptions>): string;
    get(keyword: string, options?: Partial<SearchOptions>): SearchAd[] | null;
    set(keyword: string, data: SearchAd[], options?: Partial<SearchOptions>): void;
    clear(): void;
    info(): { size: number; files: number; dir: string; sizeGB?: string; error?: string };
  }

  export const plugins: {
    normalizeLocationPlugin(): SearchPlugin;
    scoreByPricePlugin(options?: { min?: number; max?: number }): SearchPlugin;
  };

  export function search(keyword: string, options?: SearchOptions): Promise<SearchAd[]>;
  export function searchListings(keyword: string, options?: SearchOptions): Promise<SearchAd[]>;
  export function searchPages(keyword: string, options?: SearchOptions): AsyncGenerator<SearchAd[], void, unknown>;
  export function getSearchSummary(keyword: string, options?: SearchOptions): Promise<SearchSummary>;

  export function getAd(url: string, options?: AdPageOptions): Promise<DetailedAd>;
  export function getAdDetails(url: string, options?: AdPageOptions): Promise<DetailedAd>;

  export function batch(urls: string[], options?: BatchOptions): Promise<BatchResult>;
  export function processAdsBatch(urls: string[], options?: BatchOptions): Promise<BatchResult>;
  export function getImagesFromUrls(
    urls: string[],
    options?: BatchOptions
  ): Promise<{
    results: Array<{
      id: string;
      url: string;
      title: string;
      image_count: number;
      main_image: string | null;
      images: string[];
    }>;
    all_images: string[];
    errors: BatchResult['errors'];
    stats: BatchResult['stats'];
  }>;

  export const utils: {
    normalizeText(value: unknown): string;
    canonicalizeAd(ad: Partial<SearchAd>): SearchAd;
    dedupeAds(ads: SearchAd[]): SearchAd[];
    applyAdPlugins(ads: SearchAd[], plugins?: SearchPlugin[], context?: SearchPluginContext): SearchAd[];
    runResultPlugins(ads: SearchAd[], plugins?: SearchPlugin[], context?: SearchPluginContext): SearchAd[];
    sortAds<T extends SearchAd | DetailedAd>(ads: T[], sortBy?: SortBy): T[];
    filterAds<T extends SearchAd | DetailedAd>(ads: T[], filters: Record<string, unknown>): T[];
    exportToCSV(ads: SearchAd[] | DetailedAd[], filename?: string): Promise<void>;
    exportToJSONL(ads: SearchAd[] | DetailedAd[], filename?: string): Promise<void>;
    exportToParquet(ads: SearchAd[] | DetailedAd[], filename?: string): Promise<void>;
    exportToJSON(ads: SearchAd[] | DetailedAd[] | Record<string, unknown>, filename?: string): void;
    generateStats(ads: SearchAd[] | DetailedAd[]): Record<string, unknown>;
    displayTable(ads: SearchAd[] | DetailedAd[], columns?: string[]): void;
    formatPrice(price: unknown): string | null;
    parsePrice(price: string | number | null | undefined): number;
  };

  export const constants: {
    SORT_OPTIONS: {
      PRICE_ASC: 'price-asc';
      PRICE_DESC: 'price-desc';
      DATE_ASC: 'date-asc';
      DATE_DESC: 'date-desc';
      RELEVANCE: 'relevance';
    };
    DEFAULTS: {
      SEARCH: Required<SearchOptions>;
      AD_PAGE: Required<AdPageOptions>;
      BATCH: Required<BatchOptions>;
    };
    ERRORS: Record<string, string>;
  };

  export const version: string;
}
