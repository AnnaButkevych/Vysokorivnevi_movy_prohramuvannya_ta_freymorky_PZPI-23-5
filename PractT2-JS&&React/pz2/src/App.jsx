import { useEffect, useState } from "react";
import "./App.css";

const movieStorageKey = "pz2-movies-v1";

const initialMovies = [
  {
    id: 1,
    title: "Dune: Part Two",
    genre: "Sci-Fi",
    year: "2024",
    rating: "9",
    review: "Масштабна постановка з сильним візуальним стилем і ритмом.",
  },
  {
    id: 2,
    title: "The Holdovers",
    genre: "Drama",
    year: "2023",
    rating: "8",
    review: "Тиха, тепла історія з чудовою акторською роботою.",
  },
  {
    id: 3,
    title: "Spider-Man: Across the Spider-Verse",
    genre: "Animation",
    year: "2023",
    rating: "10",
    review: "Енергійна анімація та дуже сильна режисура.",
  },
];

const initialMovieForm = {
  title: "",
  genre: "Drama",
  year: new Date().getFullYear().toString(),
  rating: "8",
  review: "",
};

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [movieForm, setMovieForm] = useState(initialMovieForm);
  const [movies, setMovies] = useState(() => {
    if (typeof window === "undefined") {
      return initialMovies;
    }

    const savedMovies = window.localStorage.getItem(movieStorageKey);
    return safeParse(savedMovies, initialMovies);
  });
  const [movieSearch, setMovieSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    window.localStorage.setItem(movieStorageKey, JSON.stringify(movies));
  }, [movies]);

  function handleMovieSubmit(event) {
    event.preventDefault();

    const title = movieForm.title.trim();

    if (!title) {
      return;
    }

    setMovies((currentMovies) => [
      {
        id: Date.now(),
        title,
        genre: movieForm.genre,
        year: movieForm.year,
        rating: movieForm.rating,
        review: movieForm.review.trim(),
      },
      ...currentMovies,
    ]);

    setMovieForm(initialMovieForm);
  }

  function removeMovie(movieId) {
    setMovies((currentMovies) =>
      currentMovies.filter((movie) => movie.id !== movieId),
    );
  }

  const visibleMovies = movies
    .filter((movie) => {
      const searchableText =
        `${movie.title} ${movie.genre} ${movie.review}`.toLowerCase();
      const matchesSearch = searchableText.includes(movieSearch.toLowerCase());
      const matchesGenre = genreFilter === "All" || movie.genre === genreFilter;

      return matchesSearch && matchesGenre;
    })
    .sort((firstMovie, secondMovie) => {
      if (sortBy === "title") {
        return firstMovie.title.localeCompare(secondMovie.title);
      }

      if (sortBy === "rating") {
        return Number(secondMovie.rating) - Number(firstMovie.rating);
      }

      return Number(secondMovie.id) - Number(firstMovie.id);
    });

  const genres = ["All", ...new Set(movies.map((movie) => movie.genre))];

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">PZ2 · React · JS</p>
          <h1>Трекер фільмів</h1>
          <p className="hero-copy">
            У цій частині залишені тільки рівні 3-4: додавання фільмів і
            рецензій, а також пошук, фільтрація та сортування.
          </p>
        </div>
        <div className="hero-stats">
          <article>
            <span>Усього фільмів</span>
            <strong>{movies.length}</strong>
          </article>
          <article>
            <span>Показано</span>
            <strong>{visibleMovies.length}</strong>
          </article>
          <article>
            <span>Жанрів</span>
            <strong>{genres.length - 1}</strong>
          </article>
        </div>
      </section>

      <section className="panel movie-panel">
        <div className="section-head">
          <div>
            <p className="section-label">Рівень 3-4</p>
            <h2>Трекер фільмів</h2>
          </div>
          <span className="chip">localStorage</span>
        </div>

        <form className="movie-form" onSubmit={handleMovieSubmit}>
          <label>
            Назва
            <input
              value={movieForm.title}
              onChange={(event) =>
                setMovieForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value,
                }))
              }
              placeholder="Наприклад, Inception"
            />
          </label>
          <label>
            Жанр
            <select
              value={movieForm.genre}
              onChange={(event) =>
                setMovieForm((currentForm) => ({
                  ...currentForm,
                  genre: event.target.value,
                }))
              }
            >
              <option>Drama</option>
              <option>Sci-Fi</option>
              <option>Comedy</option>
              <option>Animation</option>
              <option>Action</option>
              <option>Thriller</option>
            </select>
          </label>
          <label>
            Рік
            <input
              type="number"
              min="1900"
              max="2100"
              value={movieForm.year}
              onChange={(event) =>
                setMovieForm((currentForm) => ({
                  ...currentForm,
                  year: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Рейтинг
            <input
              type="range"
              min="1"
              max="10"
              value={movieForm.rating}
              onChange={(event) =>
                setMovieForm((currentForm) => ({
                  ...currentForm,
                  rating: event.target.value,
                }))
              }
            />
            <span className="range-value">{movieForm.rating}/10</span>
          </label>
          <label className="full-width">
            Рецензія
            <textarea
              rows="4"
              value={movieForm.review}
              onChange={(event) =>
                setMovieForm((currentForm) => ({
                  ...currentForm,
                  review: event.target.value,
                }))
              }
              placeholder="Коротко опишіть враження від фільму"
            />
          </label>
          <button type="submit">Додати фільм</button>
        </form>

        <div className="toolbar">
          <label>
            Пошук
            <input
              value={movieSearch}
              onChange={(event) => setMovieSearch(event.target.value)}
              placeholder="Назва або рецензія"
            />
          </label>
          <label>
            Фільтр жанру
            <select
              value={genreFilter}
              onChange={(event) => setGenreFilter(event.target.value)}
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Сортування
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Спочатку нові</option>
              <option value="rating">За рейтингом</option>
              <option value="title">За назвою</option>
            </select>
          </label>
        </div>

        <div className="movie-grid">
          {visibleMovies.map((movie) => (
            <article key={movie.id} className="movie-card">
              <div className="movie-meta">
                <strong>{movie.title}</strong>
                <span>{movie.genre}</span>
              </div>
              <p>{movie.year}</p>
              <p className="rating-pill">Рейтинг {movie.rating}/10</p>
              <p className="review-text">{movie.review || "Без рецензії"}</p>
              <button
                type="button"
                className="ghost-button"
                onClick={() => removeMovie(movie.id)}
              >
                Видалити
              </button>
            </article>
          ))}
        </div>

        {visibleMovies.length === 0 ? (
          <p className="empty-state">
            За заданими параметрами фільми не знайдено.
          </p>
        ) : null}
      </section>
    </main>
  );
}

export default App;
