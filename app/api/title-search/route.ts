import { NextResponse } from "next/server";

const ACCESS_KEY = "ty7VA*mT4ovvZhTsQPtMxo2G2QoKLx-C";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "キーワードが指定されていません" },
      { status: 400 }
    );
  }

  try {
    const apiUrl = new URL("https://junkudo.search.zetacx.net/api/search/item");

    apiUrl.searchParams.set("access_key", ACCESS_KEY);
    apiUrl.searchParams.set("count", "20");
    apiUrl.searchParams.set("keyword", keyword);
    apiUrl.searchParams.set("publication_date", "2027/06/ALL/before");
    apiUrl.searchParams.set("adult_flg", "2");
    apiUrl.searchParams.set("page", "1");

    const response = await fetch(apiUrl.toString(), {
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "タイトル検索APIからエラーが返りました",
          status: response.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);

    const products = (data.product_list || []).map((product: any) => ({
      title: product.product_name,
      isbn: product.isbn,
      author: product.author?.author_name || "",
      publisher: product.publisher?.publisher_name || "",
      releaseDate: product.release?.release_date || "",
      price: product.price?.tax_included_price || null,
      imageUrl: product.image?.image_path || "",
    }));

    return NextResponse.json({
      keyword,
      total: data.total_item_count || products.length,
      products,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "タイトル検索に失敗しました",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}