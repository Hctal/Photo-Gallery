import { useEffect, useState } from "react";

interface Pin {
  id: string;
  urls: { regular: string };
}

const UNSPLASH_API_URL = "https://api.unsplash.com/photos";
const ACCESS_KEY = "-WzKDOjYBaTLoSYVAdDd0iKD8uo8kx3CkNjnRk7LQzU";

const fetchPins = async (page: number, perPage: number = 10): Promise<Pin[]> => {
  const response = await fetch(
    `${UNSPLASH_API_URL}?client_id=${ACCESS_KEY}&page=${page}&per_page=${perPage}`
  );
  if (!response.ok) throw new Error("Failed to fetch pins");
  return await response.json();
};

export default function App() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadMorePins = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const newPins = await fetchPins(page, 10);
      setPins((prev) => [...prev, ...newPins]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching pins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        !loading
      ) {
        loadMorePins();
      }
    };

    window.addEventListener("scroll", onScroll);
    // Initial fetch
    loadMorePins();

    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]); // only depend on loading

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">L@TCH</h1>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {pins.map((pin) => (
          <div
            key={pin.id}
            className="break-inside-avoid overflow-hidden rounded-xl shadow-md bg-white"
          >
            <img src={pin.urls.regular} alt="pin" className="w-full object-cover" />
          </div>
        ))}
      </div>
      {loading && (
        <p className="text-center mt-4 text-gray-600">Loading more pins...</p>
      )}
    </div>
  );
}
