import { useEffect, useState } from "react";

interface Pin {
  id: string;
  urls: { regular: string };
}

const UNSPLASH_API_URL = "https://api.unsplash.com/photos";
const ACCESS_KEY = "X77SlxGwnEyMPV_fYxtHzCEzydelQ1D_q95ux7z6wuE";

const fetchPins = async (page: number, perPage: number = 10): Promise<Pin[]> => {
  const response = await fetch(
    `${UNSPLASH_API_URL}?client_id=${ACCESS_KEY}&page=${page}&per_page=${perPage}`
  );
  if (!response.ok) throw new Error("Failed to fetch pins");
  return await response.json();
};

export default function App() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [favorites, setFavorites] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [viewFavorites, setViewFavorites] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
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
        !loading && !viewFavorites
      ) {
        loadMorePins();
      }
    };

    window.addEventListener("scroll", onScroll);
    loadMorePins();

    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, viewFavorites]);

  const displayedPins = viewFavorites ? favorites : pins;

  return (
    <div className="bg-[#f5f5f5] min-h-screen p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">L@CH</h1>
        <button
          onClick={() => setViewFavorites(!viewFavorites)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {viewFavorites ? "Show All Pins" : "View Favorites"}
        </button>
      </header>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {displayedPins.map((pin) => {
          const isFav = favorites.find((fav) => fav.id === pin.id);
          return (
            <div
              key={pin.id}
              className="relative break-inside-avoid overflow-hidden rounded-xl shadow-md bg-white"
            >
              <img src={pin.urls.regular} alt="pin" className="w-full object-cover" />
              <button
                onClick={() =>
                  isFav ? removeFromFavorites(pin.id) : saveToFavorites(pin)
                }
                className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-2"
              >
                {isFav ? "💔" : "❤️"}
              </button>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="text-center mt-4 text-gray-600">Loading more pins...</p>
      )}
    </div>
  );
}
