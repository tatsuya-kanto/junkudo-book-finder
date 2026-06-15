"use client";

import { useEffect, useState } from "react";

type Product = {
  title: string;
  isbn: string;
  author: string;
  publisher: string;
  releaseDate: string;
  price: number | null;
  imageUrl: string;
};

type StockResult = {
  isbn: string;
  title?: string;
  store: string;
  storeCode: string;
  stockQuantity: number;
  stockStatus: string;
  displayPlaceName: string;
  productUrl: string;
};

type MyBook = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  releaseDate: string;
  imageUrl: string;
  stockStatus: string;
  stockQuantity: number;
  displayPlaceName: string;
  productUrl: string;
  addedAt: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [result, setResult] = useState<StockResult | null>(null);
  const [myList, setMyList] = useState<MyBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockLoadingIsbn, setStockLoadingIsbn] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("junbook-my-list");
    if (saved) {
      setMyList(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("junbook-my-list", JSON.stringify(myList));
  }, [myList]);

  const isIsbnLike = (text: string) => {
    const cleaned = text.replace(/[^0-9Xx]/g, "");
    return cleaned.length === 10 || cleaned.length === 13;
  };

  const searchStockByIsbn = async (isbn: string, product?: Product) => {
    setStockLoadingIsbn(isbn);
    setError("");
    setResult(null);
    setProducts([]);
    setSelectedProduct(product || null);

    try {
      const cleanedIsbn = isbn.replace(/[^0-9Xx]/g, "");
      const url = "/api/search?isbn=" + encodeURIComponent(cleanedIsbn);
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "在庫検索に失敗しました");
      }

      setResult(data);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setStockLoadingIsbn("");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setProducts([]);
    setResult(null);
    setSelectedProduct(null);

    try {
      const trimmed = query.trim();

      if (!trimmed) {
        throw new Error("ISBNまたはタイトルを入力してください");
      }

      if (isIsbnLike(trimmed)) {
        await searchStockByIsbn(trimmed);
        return;
      }

      const url = "/api/title-search?keyword=" + encodeURIComponent(trimmed);
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "タイトル検索に失敗しました");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const addToMyList = () => {
    if (!result) return;

    const alreadyExists = myList.some((book) => book.isbn === result.isbn);
    if (alreadyExists) {
      setError("この本はすでにマイリストに入っています");
      return;
    }

    const book: MyBook = {
      isbn: result.isbn,
      title: selectedProduct?.title || result.title || "タイトル不明",
      author: selectedProduct?.author || "",
      publisher: selectedProduct?.publisher || "",
      releaseDate: selectedProduct?.releaseDate || "",
      imageUrl: selectedProduct?.imageUrl || "",
      stockStatus: result.stockStatus,
      stockQuantity: result.stockQuantity,
      displayPlaceName: result.displayPlaceName,
      productUrl: result.productUrl,
      addedAt: new Date().toISOString(),
    };

    setMyList([book, ...myList]);
    setError("");
  };

  const removeFromMyList = (isbn: string) => {
    setMyList(myList.filter((book) => book.isbn !== isbn));
  };

  const isInMyList = result
    ? myList.some((book) => book.isbn === result.isbn)
    : false;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-10">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-5 shadow sm:p-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
          ジュンク堂 池袋本店 在庫検索
        </h1>

        <p className="mb-6 text-sm text-gray-600 sm:text-base">
          タイトルまたはISBNを入力すると、池袋本店の在庫と棚位置を表示します
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="font-medium">タイトル / ISBN</span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="僧侶と哲学者"
              className="mt-2 w-full rounded border p-3 text-base"
            />
          </label>

          <button
            onClick={handleSearch}
            disabled={loading || !query}
            className="w-full rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400 sm:w-auto"
          >
            {loading ? "検索中..." : "検索"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold">検索結果</h2>

            <div className="flex gap-4 rounded bg-gray-50 p-4 sm:gap-5 sm:p-5">
              {selectedProduct?.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="h-32 w-22 border object-cover sm:h-36 sm:w-24"
                />
              )}

              <div className="flex-1 space-y-2">
                <p className="text-lg font-bold">
                  {selectedProduct?.title || result.title || "タイトル不明"}
                </p>

                {selectedProduct?.author && (
                  <p className="text-sm text-gray-700">
                    著者：{selectedProduct.author}
                  </p>
                )}

                <p className="text-sm text-gray-700">ISBN：{result.isbn}</p>

                <div className="mt-4 space-y-2 text-base">
                  <p>
                    <strong>店舗：</strong>
                    {result.store}
                  </p>

                  <p>
                    <strong>在庫：</strong>
                    {result.stockStatus}（{result.stockQuantity}冊）
                  </p>

                  <p>
                    <strong>棚位置：</strong>
                    {result.displayPlaceName}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={addToMyList}
                    disabled={isInMyList}
                    className="rounded bg-orange-500 px-4 py-3 text-white hover:bg-orange-600 disabled:bg-gray-400"
                  >
                    {isInMyList ? "追加済み" : "マイリストに追加"}
                  </button>

                  <a
                    href={result.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border px-4 py-3 text-center text-blue-600 underline"
                  >
                    商品ページを開く
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {myList.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold">
              マイリスト（{myList.length}冊）
            </h2>

            <div className="space-y-4">
              {myList.map((book) => (
                <div key={book.isbn} className="flex gap-4 rounded bg-yellow-50 p-4">
                  {book.imageUrl && (
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="h-28 w-20 border object-cover"
                    />
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="font-bold">{book.title}</p>

                    {book.author && (
                      <p className="text-sm text-gray-700">
                        著者：{book.author}
                      </p>
                    )}

                    <p className="text-sm">
                      在庫：{book.stockStatus}（{book.stockQuantity}冊）
                    </p>

                    <p className="text-sm">
                      棚位置：{book.displayPlaceName}
                    </p>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => searchStockByIsbn(book.isbn)}
                        className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                      >
                        在庫を再確認
                      </button>

                      <button
                        onClick={() => removeFromMyList(book.isbn)}
                        className="rounded bg-gray-700 px-3 py-2 text-white hover:bg-gray-800"
                      >
                        買った / 違ったので削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold">候補一覧</h2>

            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.isbn} className="flex gap-4 rounded bg-gray-50 p-4">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-28 w-20 border object-cover"
                    />
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="font-bold">{product.title}</p>
                    <p className="text-sm text-gray-700">
                      著者：{product.author || "不明"}
                    </p>
                    <p className="text-sm text-gray-700">
                      出版社：{product.publisher || "不明"}
                    </p>
                    <p className="text-sm text-gray-700">
                      {product.releaseDate}
                    </p>
                    <p className="text-sm text-gray-700">
                      ISBN：{product.isbn}
                    </p>

                    <button
                      onClick={() => searchStockByIsbn(product.isbn, product)}
                      disabled={!!stockLoadingIsbn}
                      className="mt-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {stockLoadingIsbn === product.isbn
                        ? "在庫確認中..."
                        : "池袋本店の在庫を見る"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}