"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type SortMode = "addedAt" | "floor";

function extractFloor(text: string) {
  const match = text.match(/(\d+)階/);
  return match ? Number(match[1]) : 999;
}

export default function MyListPage() {
  const [myList, setMyList] = useState<MyBook[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("addedAt");
  const [loadingIsbn, setLoadingIsbn] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("junbook-my-list");
    if (saved) {
      setMyList(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("junbook-my-list", JSON.stringify(myList));
  }, [myList]);

  const sortedList = useMemo(() => {
    const copied = [...myList];

    if (sortMode === "addedAt") {
      return copied.sort(
        (a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    }

    return copied.sort(
      (a, b) =>
        extractFloor(a.displayPlaceName) - extractFloor(b.displayPlaceName)
    );
  }, [myList, sortMode]);

  const removeFromMyList = (isbn: string) => {
    setMyList(myList.filter((book) => book.isbn !== isbn));
  };

  const refreshStock = async (book: MyBook) => {
    setLoadingIsbn(book.isbn);

    try {
      const response = await fetch(
        "/api/search?isbn=" + encodeURIComponent(book.isbn)
      );
      const data = await response.json();

      setMyList(
        myList.map((item) =>
          item.isbn === book.isbn
            ? {
                ...item,
                stockStatus: data.stockStatus,
                stockQuantity: data.stockQuantity,
                displayPlaceName: data.displayPlaceName,
              }
            : item
        )
      );
    } finally {
      setLoadingIsbn("");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-10">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-5 shadow sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              マイリスト
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              本屋で見る本をまとめて管理します
            </p>
          </div>

          <Link
            href="/"
            className="rounded border px-3 py-2 text-sm text-blue-600"
          >
            検索へ
          </Link>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSortMode("addedAt")}
            className={
              sortMode === "addedAt"
                ? "rounded bg-blue-600 px-4 py-2 text-white"
                : "rounded bg-gray-200 px-4 py-2"
            }
          >
            追加日順
          </button>

          <button
            onClick={() => setSortMode("floor")}
            className={
              sortMode === "floor"
                ? "rounded bg-blue-600 px-4 py-2 text-white"
                : "rounded bg-gray-200 px-4 py-2"
            }
          >
            フロア順
          </button>
        </div>

        {sortedList.length === 0 ? (
          <div className="rounded bg-gray-50 p-6 text-gray-600">
            まだマイリストに本がありません。
          </div>
        ) : (
          <div className="space-y-4">
            {sortedList.map((book) => (
              <div
                key={book.isbn}
                className="flex gap-4 rounded bg-yellow-50 p-4"
              >
                {book.imageUrl && (
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="h-24 w-16 border object-cover"
                  />
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-bold leading-snug">
                    {book.title}
                  </p>

                  {book.author && (
                    <p className="text-sm text-gray-700">
                      著者：{book.author}
                    </p>
                  )}

                  <p className="text-sm">
                    在庫：{book.stockStatus}（{book.stockQuantity}冊）
                  </p>

                  <p className="text-sm font-medium">
                    {book.displayPlaceName}
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => refreshStock(book)}
                      disabled={!!loadingIsbn}
                      className="rounded bg-green-600 px-3 py-2 text-white disabled:bg-gray-400"
                    >
                      {loadingIsbn === book.isbn
                        ? "確認中..."
                        : "在庫再確認"}
                    </button>

                    <button
                      onClick={() => removeFromMyList(book.isbn)}
                      className="rounded bg-gray-700 px-3 py-2 text-white"
                    >
                      買った / 違ったので削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}