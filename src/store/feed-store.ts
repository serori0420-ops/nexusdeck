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
        url: 'https://cloudblog.withgoogle.com/ja/rss/',
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
        id: 'preset-kantei',
        title: '内閣府・官邸',
        description: '政府方針、骨太の方針、官邸主導のAI・成長戦略',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('首相官邸 OR 内閣府 OR 政府AI戦略 OR 骨太の方針'),
        category: '政府・政策'
    },
    {
        id: 'preset-digital-agency',
        title: 'デジタル庁',
        description: 'ガバメントクラウド、マイナンバー、行政デジタル化',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('デジタル庁 OR ガバメントクラウド OR マイナンバーカード OR 行政デジタル化'),
        category: '政府・政策'
    },
    {
        id: 'preset-keisansho',
        title: '経済産業省',
        description: '半導体戦略、GX、スタートアップ支援、産業DX',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('経済産業省 OR 半導体戦略 OR GX OR スタートアップ支援 OR 産業DX'),
        category: '政府・政策'
    },
    {
        id: 'preset-soumu',
        title: '総務省',
        description: '情報通信政策、5G/6G、サイバーセキュリティ',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('総務省 OR 情報通信政策 OR 5G OR 6G OR サイバーセキュリティ'),
        category: '政府・政策'
    },
    {
        id: 'preset-ai-policy',
        title: 'AI規制・ガバナンス（国内）',
        description: 'AIガイドライン、生成AI規制、AI基本法の動向',
        sourceName: 'Policy',
        url: buildGoogleNewsRssUrl('AI規制 OR AIガバナンス OR 生成AI規制 OR AI基本法'),
        category: '政府・政策'
    },
    {
        id: 'preset-intl-digital-policy',
        title: '国際デジタル政策',
        description: 'EU AI法、米国AI規制、G7・OECDのデジタル戦略',
        sourceName: 'Policy',
        url: buildGoogleNewsRssUrl('EU AI法 OR EU AI Act OR 米国AI規制 OR G7 AI OR OECD デジタル'),
        category: '政府・政策'
    },
    {
        id: 'preset-gov-ai-cases',
        title: '行政AI活用事例',
        description: '自治体・省庁のAI導入事例、公共サービスへのAI活用',
        sourceName: 'Gov',
        url: buildGoogleNewsRssUrl('行政 AI活用 OR 自治体 AI導入 OR 公共サービス AI OR 行政DX AI事例'),
        category: '政府・政策'
    },
    // トピック (Google News)
    {
        id: 'preset-topic-data-utilization',
        title: 'データ利活用事例',
        description: '行政・民間を問わず、データ活用・連携・オープンデータの事例',
        sourceName: 'Topic',
        url: buildGoogleNewsRssUrl('データ利活用 OR データ活用事例 OR オープンデータ OR データ連携基盤 OR データ駆動'),
        category: 'トピック'
    },
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
    {
        id: 'preset-anthropic-blog',
        title: 'Anthropic Blog',
        description: 'Anthropic の研究・製品・会社ニュース（公式ブログ）',
        sourceName: 'Anthropic',
        url: '/api/anthropic-blog',
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
    // Digest Settings
    digestEmail: string
    digestHour: number
    setDigestEmail: (email: string) => void
    setDigestHour: (hour: number) => void
    // System
    hasSeenTutorial: boolean
    setHasSeenTutorial: (val: boolean) => void
    isCloudLoaded: boolean
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
            isCloudLoaded: false,
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
                        // 何か追加されたら初期化済みとする
                        isInitialized: true
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
                        const cloudColumns = (data.columns as FeedColumnConfig[]) || []
                        const localColumns = get().columns

                        // マージロジック: ローカルにしかない（追加したての）カラムを保護
                        const mergedColumns = [...cloudColumns]
                        localColumns.forEach(localCol => {
                            if (!mergedColumns.some(cloudCol => cloudCol.url === localCol.url)) {
                                mergedColumns.push(localCol)
                            }
                        })

                        set({
                            columns: mergedColumns,
                            bookmarks: (data.bookmarks as Article[]) || get().bookmarks,
                            viewMode: (data.view_mode as 'card' | 'compact' | 'gallery') || get().viewMode,
                            readArticleIds: (data.read_article_ids as string[]) || get().readArticleIds,
                            globalMuteKeywords: (data.mute_keywords as string[]) || get().globalMuteKeywords,
                            isInitialized: data.is_initialized ?? get().isInitialized,
                            digestEmail: (data.digest_email as string) || get().digestEmail,
                            digestHour: (data.digest_hour as number) ?? get().digestHour,
                            isCloudLoaded: true,
                        })

                        // マージが発生した場合はクラウドに反映
                        if (mergedColumns.length > cloudColumns.length) {
                            get().syncToCloud()
                        }
                    } else {
                        set({ isCloudLoaded: true })
                    }
                } catch (e) {
                    console.error('Failed to load from cloud:', e)
                    set({ isCloudLoaded: true })
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
                        is_initialized: state.isInitialized,
                        digest_email: state.digestEmail,
                        digest_hour: state.digestHour,
                        updated_at: new Date().toISOString(),
                    })
                } catch (e) {
                    console.error('Failed to sync to cloud:', e)
                }
            },

            // Digest Settings
            digestEmail: '',
            digestHour: 7,
            setDigestEmail: (email) => {
                set({ digestEmail: email })
                get().syncToCloud()
            },
            setDigestHour: (hour) => {
                set({ digestHour: hour })
                get().syncToCloud()
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
                isInitialized: state.isInitialized,
                digestEmail: state.digestEmail,
                digestHour: state.digestHour,
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
