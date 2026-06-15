import { NextResponse } from "next/server";

const ACCESS_KEY = "Ydoa7ygeyUMDGRtDqEvpGGzNRYco6XK4";
const STORE_CODE = "70019";

function extractTitleFromHtml(html: string) {
  const titleMatch = html.match(/<title>\s*([\s\S]*?)\s*(&ndash;|–|-)\s*丸善ジュンク堂書店ネットストア/i);

  if (titleMatch?.[1]) {
    return titleMatch[1].replace(/\s+/g, " ").trim();
  }

  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);

  if (ogTitleMatch?.[1]) {
    return ogTitleMatch[1]
      .replace("MARUZEN JUNKUDO |", "")
      .trim();
  }

  return "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json(
      { error: "ISBNが指定されていません" },
      { status: 400 }
    );
  }

  try {
    const productUrl = `https://www.maruzenjunkudo.co.jp/products/${isbn}`;

    const [stockResponse, productResponse] = await Promise.all([
      fetch(
        `https://api-item-info-ttmpxhtqra-an.a.run.app/?access_key=${ACCESS_KEY}&jan_isbn=${isbn}&type=2&store_code=${STORE_CODE}`,
        { cache: "no-store" }
      ),
      fetch(productUrl, { cache: "no-store" }),
    ]);

    const stockText = await stockResponse.text();
    const productHtml = await productResponse.text();

    if (!stockResponse.ok) {
      return NextResponse.json(
        {
          error: "丸善ジュンク堂APIからエラーが返りました",
          status: stockResponse.status,
          body: stockText,
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(stockText);
    const item = Array.isArray(data) ? data[0] : null;
    const title = extractTitleFromHtml(productHtml);

    if (!item) {
      return NextResponse.json({
        isbn,
        title,
        store: "ジュンク堂 池袋本店",
        storeCode: STORE_CODE,
        stockQuantity: 0,
        stockStatus: "在庫×",
        displayPlaceName: "在庫情報が見つかりませんでした。",
        productUrl,
      });
    }

    const stockQuantity = Number(item.stock_quantity ?? 0);
    const displayPlaceName =
      item.place_list?.[0]?.display_place_name ??
      "棚位置情報が見つかりませんでした。";

    const stockStatus =
      stockQuantity >= 4 ? "在庫○" : stockQuantity >= 1 ? "在庫△" : "在庫×";

    return NextResponse.json({
      isbn,
      title,
      store: "ジュンク堂 池袋本店",
      storeCode: STORE_CODE,
      stockQuantity,
      stockStatus,
      displayPlaceName,
      productUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "在庫情報の取得に失敗しました",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}