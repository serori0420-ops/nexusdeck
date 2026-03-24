import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// .env.local から環境変数を読み込む
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// ⚠️ セキュリティ注意: Service Role Key は RLS をバイパスする最高権限キー。
// このスクリプトはローカル実行専用。外部に公開・デプロイしないこと。
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// MCPサーバが操作対象とするユーザーID（.env.local の MCP_TARGET_USER_ID で指定可能）
const targetUserId = process.env.MCP_TARGET_USER_ID;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "tech-gov-stream-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * ツール定義のリスト
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_columns",
        description: "現在登録されているニュースカラム（ソース）の一覧を取得します",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_bookmarks",
        description: "ユーザーがブックマークした記事の一覧を取得します",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "add_bookmark",
        description: "有益な記事をブックマークに追加します",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "記事のタイトル" },
            url: { type: "string", description: "記事のURL" },
            sourceName: { type: "string", description: "発行元名" },
            summary: { type: "string", description: "記事の要約" },
          },
          required: ["title", "url"],
        },
      },
    ],
  };
});

/**
 * ツール実行のハンドラ
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // ユーザー設定の取得（環境変数で指定されたユーザーIDを優先）
    let query = supabase.from("user_settings").select("*");
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }
    const { data: settings } = await query.limit(1).single();

    if (!settings) {
      throw new Error("No user settings found in Supabase" + (targetUserId ? ` for user_id: ${targetUserId}` : ""));
    }

    switch (name) {
      case "get_columns": {
        return {
          content: [{ type: "text", text: JSON.stringify(settings.columns, null, 2) }],
        };
      }

      case "get_bookmarks": {
        return {
          content: [{ type: "text", text: JSON.stringify(settings.bookmarks, null, 2) }],
        };
      }

      case "add_bookmark": {
        const { title, url, sourceName, summary } = args as any;
        const existingBookmarks = (settings.bookmarks || []) as any[];

        // 重複チェック: 同じURLのブックマークが既にある場合はスキップ
        if (existingBookmarks.some((b: any) => b.url === url)) {
          return {
            content: [{ type: "text", text: `Bookmark already exists: ${title}` }],
          };
        }

        const newBookmark = {
          id: `ai-${Date.now()}`,
          title,
          url,
          sourceName: sourceName || "AI Scout",
          summary: summary || "",
          publishedAt: new Date().toISOString(),
        };

        const updatedBookmarks = [newBookmark, ...existingBookmarks];

        const { error } = await supabase
          .from("user_settings")
          .update({ bookmarks: updatedBookmarks })
          .eq("user_id", settings.user_id);

        if (error) throw error;

        return {
          content: [{ type: "text", text: `Successfully added bookmark: ${title}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${error.message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tech & Gov Stream MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
