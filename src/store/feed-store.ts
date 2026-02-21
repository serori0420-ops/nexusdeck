import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Article } from '@/components/feed/feed-card'
import { supabase } from '@/lib/supabase'

export interface FeedColumnConfig {
    id: string
    title: string
    url: string
    sourceName: string
}

// Preset Catalog with Categories
export const PRESET_SOURCES = [
    // 国内 Tech
    {
        id: 'preset-zenn',
        title: 'Zenn',
        description: 'エンジニアのための情報共有プラットフォーム',
        sourceName: 'Zenn',
        url: 'https://zenn.dev/feed',
        category: '国内'
    },
    {
        id: 'preset-qiita',
        title: 'Qiita',
        description: '日本最大級のエンジニアコミュニティ',
        sourceName: 'Qiita',
        url: 'https://qiita.com/popular-items/feed',
        category: '国内'
    },
    {
        id: 'preset-hatena',
        title: 'はてなブックマーク',
        description: 'テクノロジー・ITの人気エントリー',
        sourceName: 'Hatena',
        url: 'https://b.hatena.ne.jp/hotentry/it.rss',
        category: '国内'
    },
    {
        id: 'preset-publickey',
        title: 'Publickey',
        description: 'クラウド、Docker、DevOpsなどの最新技術情報',
        sourceName: 'Publickey',
        url: 'https://www.publickey1.jp/atom.xml',
        category: '国内'
    },
    {
        id: 'preset-google-cloud-jp',
        title: 'Google Cloud Blog',
        description: 'Google Cloudの最新アップデートと導入事例（日本語版）',
        sourceName: 'Google Cloud',
        url: 'https://cloud.google.com/blog/ja/rss',
        category: '国内'
    },
    // 海外 Tech
    {
        id: 'preset-techcrunch',
        title: 'TechCrunch',
        description: 'スタートアップ・最新テクノロジーニュース',
        sourceName: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: '海外'
    },
    {
        id: 'preset-verge',
        title: 'The Verge',
        description: 'ガジェット、科学、テクノロジーの総合ニュース',
        sourceName: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        category: '海外'
    },
    {
        id: 'preset-wired',
        title: 'WIRED',
        description: 'テクノロジーが社会に与える影響を考察',
        sourceName: 'WIRED',
        url: 'https://www.wired.com/feed/rss',
        category: '海外'
    },
    // 国内 Gov / Policy
    {
        id: 'preset-digital-agency',
        title: 'デジタル庁',
        description: '行政DX、マイナンバー、データ戦略など',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('デジタル庁 OR 行政DX'),
        category: '政府・政策'
    },
    {
        id: 'preset-keisansho',
        title: '経済産業省',
        description: 'デジタル政策、半導体戦略、スタートアップ支援',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('経済産業省 OR デジタル政策 OR 半導体戦略'),
        category: '政府・政策'
    },
    {
        id: 'preset-soumu',
        title: '総務省',
        description: '情報通信政策、5G/6G配置、サイバーセキュリティ',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('総務省 OR 情報通信政策'),
        category: '政府・政策'
    },
    {
        id: 'preset-ai-policy',
        title: 'AI規制・ガバナンス',
        description: 'AIガイドライン、著作権、国際的な規制動向',
        sourceName: 'Policy',
        url: buildGoogleNewsRssUrl('AI規制 OR AIガバナンス OR AIガイドライン'),
        category: '政府・政策'
    },
    // トピック (Google News)
    {
        id: 'preset-topic-ai',
        title: 'AI / 人工知能',
        description: 'AI技術、生成AI、活用事例などの最新ニュース',
        sourceName: 'Topic',
        url: buildGoogleNewsRssUrl('AI OR 人工知能'),
        category: 'トピック'
    },
    {
        id: 'preset-topic-dx',
        title: 'DX / デジタル変革',
        description: '企業のDX推進、デジタル化の取り組み',
        sourceName: 'Topic',
        url: buildGoogleNewsRssUrl('DX OR デジタルトランスフォーメーション'),
        category: 'トピック'
    },
    {
        id: 'preset-topic-poc',
        title: '実証実験 / PoC',
        description: '自治体や企業の新規事業、技術の実証実験ニュース',
        sourceName: 'Topic',
        url: buildGoogleNewsRssUrl('実証実験 OR 社会実験'),
        category: 'トピック'
    },
    // 企業 Tech Blogs
    {
        id: 'preset-mercari',
        title: 'Mercari Engineering',
        description: 'メルカリのエンジニアリングブログ',
        sourceName: 'Mercari',
        url: 'https://engineering.mercari.com/blog/feed.xml',
        category: '企業ブログ'
    },
    {
        id: 'preset-aws-jp',
        title: 'AWS Japan Blog',
        description: 'アマゾン ウェブ サービス ジャパン 公式ブログ',
        sourceName: 'AWS',
        url: 'https://aws.amazon.com/jp/blogs/news/feed/',
        category: '企業ブログ'
    },
    // GitHub Trending
    {
        id: 'preset-gh-trending',
        title: 'GitHub Trending (全体)',
        description: '今日のGitHubトレンドリポジトリ',
        sourceName: 'GitHub',
        url: '/api/github-trending?since=daily',
        category: 'GitHub'
    },
    {
        id: 'preset-gh-trending-ts',
        title: 'GitHub Trending (TypeScript)',
        description: 'TypeScriptのトレンドリポジトリ',
        sourceName: 'GitHub',
        url: '/api/github-trending?language=typescript&since=daily',
        category: 'GitHub'
    },
    {
        id: 'preset-gh-trending-python',
        title: 'GitHub Trending (Python)',
        description: 'Pythonのトレンドリポジトリ',
        sourceName: 'GitHub',
        url: '/api/github-trending?language=python&since=daily',
        category: 'GitHub'
    },
    {
        id: 'preset-gh-trending-rust',
        title: 'GitHub Trending (Rust)',
        description: 'Rustのトレンドリポジトリ',
        sourceName: 'GitHub',
        url: '/api/github-trending?language=rust&since=daily',
        category: 'GitHub'
    },
]

interface FeedStore {
    columns: FeedColumnConfig[]
    isInitialized: boolean
    viewMode: 'card' | 'compact' | 'gallery'
    // Bookmarks (Read Later)
    bookmarks: Article[]
    addBookmark: (article: Article) => void
    removeBookmark: (articleId: string) => void
    isBookmarked: (articleId: string) => boolean
    // Read Status
    readArticleIds: string[]
    markAsRead: (articleId: string) => void
    markMultipleAsRead: (articleIds: string[]) => void
    // Mute keywords
    globalMuteKeywords: string[]
    setGlobalMuteKeywords: (keywords: string[]) => void
    // Actions
    setInitialized: (val: boolean) => void
    setViewMode: (mode: 'card' | 'compact' | 'gallery') => void
    addColumn: (column: Omit<FeedColumnConfig, "id"> & { id?: string }) => void
    removeColumn: (id: string) => void
    reorderColumns: (activeId: string, overId: string) => void
    clearColumns: () => void
    // Cloud Sync
    loadFromCloud: () => Promise<void>
    syncToCloud: () => Promise<void>
    // System
    hasSeenTutorial: boolean
    setHasSeenTutorial: (val: boolean) => void
}

export const useFeedStore = create<FeedStore>()(
    persist(
        (set, get) => ({
            columns: [],
            viewMode: 'card',
            setViewMode: (mode) => {
                set({ viewMode: mode })
                get().syncToCloud()
            },
            readArticleIds: [],
            markAsRead: (articleId) => {
                set((state) => {
                    if (state.readArticleIds.includes(articleId)) return state;
                    return { readArticleIds: [...state.readArticleIds, articleId] };
                })
                get().syncToCloud()
            },
            markMultipleAsRead: (articleIds) => {
                set((state) => {
                    const newIds = articleIds.filter(id => !state.readArticleIds.includes(id));
                    if (newIds.length === 0) return state;
                    // 最大1000件程度を保持するロジック（古すぎる既読IDが膨張しないよう制限）
                    const nextIds = [...state.readArticleIds, ...newIds];
                    if (nextIds.length > 2000) return { readArticleIds: nextIds.slice(nextIds.length - 2000) };
                    return { readArticleIds: nextIds };
                })
                get().syncToCloud()
            },
            globalMuteKeywords: [],
            setGlobalMuteKeywords: (keywords) => {
                set({ globalMuteKeywords: keywords })
                get().syncToCloud()
            },
            bookmarks: [],
            isBookmarked: (articleId) => get().bookmarks.some((b) => b.id === articleId),
            addBookmark: (article) => {
                set((state) => {
                    if (state.bookmarks.some((b) => b.id === article.id)) return state;
                    return { bookmarks: [article, ...state.bookmarks] };
                })
                get().syncToCloud()
            },
            removeBookmark: (articleId) => {
                set((state) => ({
                    bookmarks: state.bookmarks.filter((b) => b.id !== articleId),
                }))
                get().syncToCloud()
            },
            isInitialized: false,
            setInitialized: (val) => set({ isInitialized: val }),
            addColumn: (column: Omit<FeedColumnConfig, 'id'> & { id?: string }) => {
                set((state) => {
                    if (state.columns.some((c) => c.url === column.url)) {
                        return state
                    }
                    return {
                        columns: [
                            ...state.columns,
                            {
                                ...column,
                                id: column.id || `col-${crypto.randomUUID()}`,
                            },
                        ],
                    }
                })
                get().syncToCloud()
            },
            removeColumn: (id) => {
                set((state) => ({
                    columns: state.columns.filter((c) => c.id !== id),
                }))
                get().syncToCloud()
            },
            reorderColumns: (activeId, overId) => {
                set((state) => {
                    const oldIndex = state.columns.findIndex((c) => c.id === activeId)
                    const newIndex = state.columns.findIndex((c) => c.id === overId)
                    if (oldIndex === -1 || newIndex === -1) return state
                    const newColumns = [...state.columns]
                    const [removed] = newColumns.splice(oldIndex, 1)
                    newColumns.splice(newIndex, 0, removed)
                    return { columns: newColumns }
                })
                get().syncToCloud()
            },
            clearColumns: () => {
                set({ columns: [] })
                get().syncToCloud()
            },

            // Cloud Sync Implementation（ユーザーID対応）
            loadFromCloud: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return

                    const { data, error } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
                    if (data) {
                        set({
                            columns: data.columns as FeedColumnConfig[],
                            bookmarks: data.bookmarks as Article[],
                            viewMode: (data.view_mode as 'card' | 'compact' | 'gallery') || 'card',
                            readArticleIds: (data.read_article_ids as string[]) || [],
                            globalMuteKeywords: (data.mute_keywords as string[]) || [],
                        })
                    }
                } catch (e) {
                    console.error('Failed to load from cloud:', e)
                }
            },
            syncToCloud: async () => {
                const state = get()
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return

                    await supabase.from('user_settings').upsert({
                        user_id: user.id,
                        columns: state.columns,
                        bookmarks: state.bookmarks,
                        view_mode: state.viewMode,
                        read_article_ids: state.readArticleIds,
                        mute_keywords: state.globalMuteKeywords,
                        updated_at: new Date().toISOString(),
                    })
                } catch (e) {
                    console.error('Failed to sync to cloud:', e)
                }
            },

            // System
            hasSeenTutorial: false,
            setHasSeenTutorial: (val) => set({ hasSeenTutorial: val }),
        }),
        {
            name: 'nexusdeck-store',
            partialize: (state) => ({
                columns: state.columns,
                bookmarks: state.bookmarks,
                viewMode: state.viewMode,
                readArticleIds: state.readArticleIds,
                globalMuteKeywords: state.globalMuteKeywords,
                hasSeenTutorial: state.hasSeenTutorial,
            }),
        }
    )
)

/**
 * Helper: Generate Google News RSS URL from keywords
 */
export function buildGoogleNewsRssUrl(keywords: string): string {
    const encoded = encodeURIComponent(keywords)
    return `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`
}
