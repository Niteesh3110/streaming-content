import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000/api' })

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NetflixTitle {
  show_id: string
  type: string | null
  title: string | null
  director: string | null
  cast: string | null
  country: string | null
  date_added: string | null
  release_year: number | null
  rating: string | null
  duration: string | null
  listed_in: string | null
  description: string | null
}

export interface PaginatedContent {
  total: number
  page: number
  limit: number
  pages: number
  items: NetflixTitle[]
}

export interface ContentFilters {
  types: string[]
  ratings: string[]
  genres: string[]
  countries: string[]
}

export interface MetadataUpdate {
  title?: string
  director?: string
  cast?: string
  country?: string
  rating?: string
  listed_in?: string
  description?: string
  date_added?: string
  release_year?: number
  duration?: string
}

export interface AuditSummary {
  total_records: number
  complete_records: number
  records_with_nulls: number
  completeness_pct: number
  duplicate_titles: number
  total_columns: number
  columns_with_nulls: number
}

export interface MissingColumn {
  column: string
  missing_count: number
  missing_pct: number
  present_count: number
  dtype: string
}

export interface DuplicatesResult {
  count: number
  items: NetflixTitle[]
}

export interface FieldStat {
  column: string
  dtype: string
  unique_values: number
  null_count: number
  sample_values: (string | number | null)[]
  min?: number
  max?: number
  mean?: number
}

export interface AnalyticsOverview {
  total_titles: number
  movies: number
  tv_shows: number
  unique_countries: number
  unique_ratings: number
  release_year_range: { min: number; max: number }
}

export interface YearCount { year: number; count: number }
export interface TypeCount { type: string; count: number }
export interface RatingCount { rating: string; count: number }
export interface GenreCount { genre: string; count: number }
export interface CountryCount { country: string; count: number }

export interface StreamingService {
  service_name: string
  tier: 'paid' | 'free'
  type?: string
  subscribers_millions: number
  monthly_price_usd?: number
  churn_rate_pct?: number
  arpu_usd?: number
  engagement_cluster?: string
  content_type?: string
  launch_year?: number
  subscribers_2020_millions?: number
  subscribers_2021_millions?: number
  subscribers_2022_millions?: number
  subscribers_2023_millions?: number
  subscribers_2024_millions?: number
  age_group_18_24_pct?: number
  age_group_25_34_pct?: number
  age_group_35_44_pct?: number
  age_group_45_54_pct?: number
  age_group_55_64_pct?: number
  age_group_65_plus_pct?: number
  device_android_pct?: number
  device_ios_pct?: number
  device_smart_tv_pct?: number
}

export interface GrowthPrediction {
  service_name: string
  current_subscribers: number
  predicted_subscribers: number
  growth_rate: number
  projected_growth: number
  predicted_arpu?: number
  predicted_monthly_revenue?: number
  type?: string
  engagement_cluster?: string
}

// ── API functions ──────────────────────────────────────────────────────────────

export const contentApi = {
  list: (params: {
    page?: number; limit?: number; search?: string; type?: string
    rating?: string; genre?: string; country?: string
    sort_by?: string; sort_order?: string
  }) => api.get<PaginatedContent>('/content/', { params }).then(r => r.data),

  filters: () => api.get<ContentFilters>('/content/filters').then(r => r.data),

  get: (showId: string) =>
    api.get<NetflixTitle>(`/content/${showId}`).then(r => r.data),

  update: (showId: string, data: MetadataUpdate) =>
    api.put<NetflixTitle>(`/content/${showId}`, data).then(r => r.data),
}

export const auditApi = {
  summary: () => api.get<AuditSummary>('/audit/summary').then(r => r.data),
  missing: () => api.get<MissingColumn[]>('/audit/missing').then(r => r.data),
  duplicates: () => api.get<DuplicatesResult>('/audit/duplicates').then(r => r.data),
  fieldStats: () => api.get<FieldStat[]>('/audit/field-stats').then(r => r.data),
}

export const analyticsApi = {
  overview: () => api.get<AnalyticsOverview>('/analytics/overview').then(r => r.data),
  contentByType: () => api.get<TypeCount[]>('/analytics/content-by-type').then(r => r.data),
  contentByYear: () => api.get<YearCount[]>('/analytics/content-by-year').then(r => r.data),
  contentAddedByYear: () => api.get<YearCount[]>('/analytics/content-added-by-year').then(r => r.data),
  contentByRating: () => api.get<RatingCount[]>('/analytics/content-by-rating').then(r => r.data),
  genres: (topN = 15) => api.get<GenreCount[]>('/analytics/genres', { params: { top_n: topN } }).then(r => r.data),
  countries: (topN = 15) => api.get<CountryCount[]>('/analytics/countries', { params: { top_n: topN } }).then(r => r.data),
  competitive: () => api.get<StreamingService[]>('/analytics/competitive').then(r => r.data),
  growth: () => api.get<GrowthPrediction[]>('/analytics/growth').then(r => r.data),
}
