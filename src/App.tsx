import { useEffect, useState } from "react";
import throttle from "lodash.throttle";

interface Pin {
  id: string;
  urls: { regular: string };
  description: string | null;
  alt_description: string | null;
}

const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY;

const fetchPins = async (
  page: number,
  perPage: number = 10,
  searchTerm?: string
): Promise<Pin[]> => {
  const isSearch = Boolean(searchTerm);
  const endpoint = isSearch
    ? `https://api.unsplash.com/search/photos?query=${searchTerm}`
    : `https://api.unsplash.com/photos`;

  const url = `${endpoint}${isSearch ? "&" : "?"}client_id=${ACCESS_KEY}&page=${page}&per_page=${perPage}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch pins");

  const data = await response.json();
  return isSearch ? data.results : data;
};

export default function App() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [favorites, setFavorites] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [viewFavorites, setViewFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const saveToFavorites = (pin: Pin) => {
    if (favorites.find((fav) => fav.id === pin.id)) return;
    const updated = [...favorites, pin];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const removeFromFavorites = (id: string) => {
    const updated = favorites.filter((fav) => fav.id !== id);
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const loadMorePins = async () => {
    if (loading || viewFavorites || !hasMore) return;
    setLoading(true);
    try {
      const newPins = await fetchPins(page, 10, searchTerm);
      if (Array.isArray(newPins) && newPins.length > 0) {
        setPins((prev) => [
          ...prev,
          ...newPins.filter((pin) => !prev.some((p) => p.id === pin.id)),
        ]);
        setPage((prevPage) => prevPage + 1);
        setHasMore(true);
      } else {
        setHasMore(false); // Stop fetching if no more results
      }
    } catch (error) {
      console.error("Error fetching pins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const newPins = await fetchPins(1, 10, searchTerm);
      setPins(newPins);
      setPage(2);
      setHasMore(true);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!viewFavorites && pins.length === 0) {
      loadMorePins();
    }

    const throttledScroll = throttle(() => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 300;
      if (scrollPosition >= threshold && !loading && !viewFavorites) {
        loadMorePins();
      }
    }, 300);

    window.addEventListener("scroll", throttledScroll);
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [loading, viewFavorites, searchTerm, pins]);

  const displayedPins = viewFavorites ? favorites : pins;

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-4">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">L@CH Gallery</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded w-48"
          />
          <button
            onClick={handleSearch}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Search
          </button>
          <button
            onClick={() => setViewFavorites(!viewFavorites)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {viewFavorites ? "Show All Pins" : "View Favorites"}
          </button>
        </div>
      </header>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {displayedPins.map((pin) => {
          const isFav = favorites.find((fav) => fav.id === pin.id);
          return (
            <div
              key={pin.id}
              className="relative break-inside-avoid overflow-hidden rounded-xl shadow-lg bg-white transition-transform duration-300 hover:scale-105 hover:shadow-xl"
            >
              <img
                src={pin.urls.regular}
                alt={pin.alt_description || "pin"}
                className="w-full object-cover transition-opacity duration-300 hover:opacity-90"
              />
              <div className="p-2 text-sm text-gray-700 line-clamp-2">
                {pin.description || pin.alt_description || "No description available"}
              </div>
              <button
                onClick={() =>
                  isFav ? removeFromFavorites(pin.id) : saveToFavorites(pin)
                }
                className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 transition duration-300"
              >
                {isFav ? "REMOVEME💔" : "ADDME❤️"}
              </button>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="text-center mt-4 text-gray-600">Loading more pins...</p>
      )}
      {!hasMore && (
        <p className="text-center mt-4 text-gray-500">🎉 You've reached the end!</p>
      )}
    </div>
  );
}
