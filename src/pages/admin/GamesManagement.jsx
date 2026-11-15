// src/pages/admin/GamesManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GameController,
  Plus,
  Monitor,
  Trash,
  PencilSimple,
  MagnifyingGlass,
  ArrowsLeftRight,
  Star,
  Eye,
  EyeSlash,
  Users,
} from "@phosphor-icons/react";
import { gameService } from "../../services/gameService";
import { screenService } from "../../services/screenService";
import { notify } from "../../utils/toastController";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { INPUT_CLASS } from "../../components/ui/Sheet";
import GameFormSheet from "../../components/games/GameFormSheet";
import { EMPTY_GAME_FORM, getModeLabel } from "../../constants/games";
import api from "../../services/api";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";
const ICON_BTN =
  "size-7 rounded-lg bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer";

const idOf = (ref) => ref?._id || ref;

function gameToForm(game) {
  return {
    ...EMPTY_GAME_FORM,
    title: game.title || "",
    genre: game.genre || "",
    description: game.description || "",
    platform: game.platform || "PS5",
    supportedModes: game.supportedModes?.length ? game.supportedModes : ["Single"],
    recommendedMode: game.recommendedMode || game.supportedModes?.[0] || "Single",
    minPlayers: game.minPlayers || 1,
    maxPlayers: game.maxPlayers || 1,
    availableScreens: (game.availableScreens || []).map(idOf),
    assignedHardware: (game.assignedHardware || []).map(idOf),
    isFeatured: Boolean(game.isFeatured),
    isActive: game.isActive !== false,
    thumbnailPreview: game.thumbnail?.url || "",
    coverPreview: game.cover?.url || game.coverUrl || "",
  };
}

export default function GamesManagement() {
  const [games, setGames] = useState([]);
  const [screens, setScreens] = useState([]);
  const [hardwareList, setHardwareList] = useState([]);
  const [loading, setLoading] = useState(true);

  // View & filters
  const [viewMode, setViewMode] = useState("store"); // "store" | "admin_columns"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  // Form sheet
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [form, setForm] = useState(EMPTY_GAME_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [gameToDelete, setGameToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesData, screensData, hardwareData] = await Promise.all([
        gameService.getGames(),
        screenService.getScreens().catch(() => []),
        api.get("/hardware").then((res) => res.data).catch(() => []),
      ]);
      setGames(Array.isArray(gamesData) ? gamesData : []);
      setScreens(Array.isArray(screensData) ? screensData : []);
      setHardwareList(Array.isArray(hardwareData) ? hardwareData : []);
    } catch {
      notify.error("Failed to load game catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Replace a single game in local state (avoids refetching everything)
  const upsertLocal = (saved) =>
    setGames((prev) => {
      const exists = prev.some((g) => g._id === saved._id);
      return exists ? prev.map((g) => (g._id === saved._id ? saved : g)) : [...prev, saved];
    });

  const genres = useMemo(() => {
    const set = new Set(games.map((g) => g.genre).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [games]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return games.filter((g) => {
      const matchQuery =
        g.title.toLowerCase().includes(q) || (g.genre || "").toLowerCase().includes(q);
      const matchGenre = selectedGenre === "all" || g.genre === selectedGenre;
      return matchQuery && matchGenre;
    });
  }, [games, searchQuery, selectedGenre]);

  /* ---------------- form handlers ---------------- */

  const openCreate = () => {
    setEditingGame(null);
    setForm(EMPTY_GAME_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (game) => {
    setEditingGame(game);
    setForm(gameToForm(game));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.genre.trim()) {
      notify.error("Please fill in game title and genre");
      return;
    }
    if (!editingGame && (!form.thumbnailFile || !form.coverFile)) {
      notify.error("Please upload both a thumbnail and a cover image");
      return;
    }

    setSubmitting(true);
    try {
      const saved = editingGame
        ? await gameService.updateGame(editingGame._id, form)
        : await gameService.createGame(form);

      upsertLocal(saved);
      notify.success(editingGame ? "Game updated" : "Game added to catalog");
      setIsFormOpen(false);
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to save game");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (game) => {
    try {
      const saved = await gameService.patchGame(game._id, { isActive: !game.isActive });
      upsertLocal(saved);
      notify.success(saved.isActive ? `${game.title} is now live` : `${game.title} hidden`);
    } catch {
      notify.error("Failed to update visibility");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;
    try {
      await gameService.deleteGame(gameToDelete);
      setGames((prev) => prev.filter((g) => g._id !== gameToDelete));
      notify.success("Game removed from catalog");
    } catch {
      notify.error("Failed to delete game");
    } finally {
      setGameToDelete(null);
    }
  };

  /* ---------------- station matrix ---------------- */

  const handleDragStart = (e, gameId) => e.dataTransfer.setData("gameId", gameId);

  const handleDropOnScreen = async (e, screenId) => {
    e.preventDefault();
    const game = games.find((g) => g._id === e.dataTransfer.getData("gameId"));
    if (!game) return;

    const current = (game.availableScreens || []).map(idOf);
    if (current.includes(screenId)) return;

    try {
      const saved = await gameService.patchGame(game._id, {
        availableScreens: [...current, screenId],
      });
      upsertLocal(saved);
      notify.success(`Assigned ${game.title} to station`);
    } catch {
      notify.error("Failed to update screen assignment");
    }
  };

  const handleRemoveFromScreen = async (game, screenId) => {
    const updated = (game.availableScreens || []).map(idOf).filter((id) => id !== screenId);
    try {
      const saved = await gameService.patchGame(game._id, { availableScreens: updated });
      upsertLocal(saved);
      notify.success("Unassigned game from station");
    } catch {
      notify.error("Failed to update screen assignment");
    }
  };

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border-divider/75 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
            Games Library
          </h1>
          <p className="mt-1 text-xs text-sub sm:text-sm">
            Manage artwork, play modes, and station assignments. {games.length} titles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border-divider bg-app-bg p-1">
            {[
              { key: "store", label: "Library", icon: GameController },
              { key: "admin_columns", label: "Station Matrix", icon: ArrowsLeftRight },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === key
                    ? "bg-primary-cyan text-app-bg font-bold shadow-sm"
                    : "text-sub hover:text-main"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className={`flex h-10 items-center gap-1.5 rounded-xl bg-primary-cyan px-3.5 font-mono text-xs font-bold uppercase tracking-wider text-app-bg shadow-md hover:bg-primary-cyan/90 cursor-pointer ${FOCUS}`}
          >
            <Plus size={15} weight="bold" /> Add Game
          </button>
        </div>
      </div>

      {/* Search & genre filters */}
      {viewMode === "store" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-panel p-3.5 rounded-2xl border border-border-divider">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
            <input
              type="text"
              placeholder="Search games or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${INPUT_CLASS} pl-10 text-xs`}
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all shrink-0 ${
                  selectedGenre === genre
                    ? "bg-primary-cyan/15 text-primary-cyan font-bold border border-primary-cyan/30"
                    : "text-sub hover:text-main bg-app-bg"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loader variant="skeleton-table" lines={5} text="Loading game catalog..." />
      ) : viewMode === "store" ? (
        filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30">
            <GameController size={32} className="text-sub mb-2" />
            <h3 className="text-sm font-bold text-main">
              {games.length === 0 ? "No games yet" : "No games found"}
            </h3>
            <p className="text-xs text-sub mt-0.5">
              {games.length === 0
                ? "Add your first game with a thumbnail and cover image."
                : "Try adjusting your search or filter."}
            </p>
            {games.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary-cyan px-3.5 py-2 text-xs font-bold text-app-bg cursor-pointer"
              >
                <Plus size={14} weight="bold" /> Add Game
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGames.map((game) => {
              const coverSrc = game.cover?.url || game.coverUrl || game.thumbnail?.url;
              const inactive = game.isActive === false;

              return (
                <div
                  key={game._id}
                  className={`group relative bg-card-panel border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col ${
                    game.isFeatured
                      ? "border-amber-400/50 hover:border-amber-400"
                      : "border-border-divider hover:border-primary-cyan/50"
                  }`}
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4] w-full bg-app-bg overflow-hidden">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={game.title}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          inactive ? "grayscale opacity-50" : ""
                        }`}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-app-bg to-card-panel p-4 text-center">
                        <GameController size={32} className="text-sub/50 mb-2" />
                        <span className="text-xs font-bold text-sub">{game.title}</span>
                        <span className="mt-1 text-[10px] text-rose-400">Missing artwork</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
                      <span className="rounded-lg bg-black/70 backdrop-blur-md px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-white/20">
                        {game.platform || "PS5"}
                      </span>
                      {game.isFeatured && (
                        <span className="flex items-center gap-0.5 rounded-lg bg-amber-400 px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
                          <Star size={9} weight="fill" /> FEATURED
                        </span>
                      )}
                      {inactive && (
                        <span className="rounded-lg bg-rose-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(game)}
                        className={`${ICON_BTN} hover:bg-primary-cyan hover:text-app-bg`}
                      >
                        <PencilSimple size={13} />
                      </button>
                      <button
                        type="button"
                        title={inactive ? "Show on website" : "Hide from website"}
                        onClick={() => handleToggleActive(game)}
                        className={`${ICON_BTN} hover:bg-amber-400 hover:text-black`}
                      >
                        {inactive ? <Eye size={13} /> : <EyeSlash size={13} />}
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setGameToDelete(game._id)}
                        className={`${ICON_BTN} hover:bg-rose-500`}
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-xs font-bold text-main truncate">{game.title}</h3>
                      <p className="text-[10px] text-sub flex items-center gap-1">
                        {game.genre}
                        <span className="text-sub/40">•</span>
                        <Users size={10} />
                        {game.minPlayers === game.maxPlayers
                          ? `${game.maxPlayers || 1}P`
                          : `${game.minPlayers}-${game.maxPlayers}P`}
                      </p>
                    </div>

                    {game.supportedModes?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {game.supportedModes.map((m) => (
                          <span
                            key={m}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              m === game.recommendedMode
                                ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                                : "border-border-divider bg-app-bg text-sub"
                            }`}
                          >
                            {getModeLabel(m)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap gap-1 pt-2 border-t border-border-divider/50">
                      {game.availableScreens?.length > 0 ? (
                        game.availableScreens.map((s) => (
                          <span
                            key={idOf(s)}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-app-bg border border-border-divider text-main"
                          >
                            {s.name || "Station"}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-sub italic">No stations</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Station Matrix */
        <div className="space-y-4">
          <div className="bg-primary-cyan/10 border border-primary-cyan/30 p-3 rounded-2xl flex items-center justify-between text-xs text-primary-cyan font-mono">
            <span>Drag games from the library into a station column to assign them.</span>
            <span className="font-bold">Matrix Edit Active</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
            <div className="bg-card-panel border border-border-divider rounded-2xl p-4 space-y-3 min-h-[400px]">
              <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                <GameController size={14} className="text-primary-cyan" /> Library ({games.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {games.map((game) => (
                  <div
                    key={game._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, game._id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-app-bg border border-border-divider cursor-grab active:cursor-grabbing hover:border-primary-cyan/50 transition-all shadow-sm"
                  >
                    <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-card-panel">
                      {game.thumbnail?.url || game.cover?.url ? (
                        <img
                          src={game.thumbnail?.url || game.cover?.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GameController size={16} className="m-auto mt-2.5 text-sub/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-main truncate">{game.title}</p>
                      <p className="text-[10px] text-sub truncate">{game.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {screens.map((screen) => {
                const assignedGames = games.filter((g) =>
                  g.availableScreens?.some((s) => idOf(s) === screen._id)
                );

                return (
                  <div
                    key={screen._id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnScreen(e, screen._id)}
                    className="bg-card-panel border border-border-divider rounded-2xl p-4 flex flex-col justify-between min-h-[400px] transition-all hover:border-primary-cyan/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border-divider pb-3">
                        <div className="flex items-center gap-2">
                          <Monitor size={16} className="text-primary-cyan" />
                          <h3 className="text-sm font-bold text-main">{screen.name}</h3>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary-cyan/10 text-primary-cyan">
                          {assignedGames.length} games
                        </span>
                      </div>

                      <div className="space-y-2 min-h-[250px]">
                        {assignedGames.length === 0 ? (
                          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-divider/60 text-center p-4">
                            <p className="text-[11px] text-sub italic">
                              Drop games here to assign to {screen.name}
                            </p>
                          </div>
                        ) : (
                          assignedGames.map((game) => (
                            <div
                              key={game._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-app-bg border border-border-divider shadow-sm group"
                            >
                              <span className="text-xs font-bold text-main truncate pr-2">
                                {game.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromScreen(game, screen._id)}
                                className="text-rose-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                title="Remove from station"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-divider/50 text-center font-mono text-[10px] text-sub uppercase tracking-wider">
                      {screen.type || "Station"} • Active
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <GameFormSheet
        isOpen={isFormOpen}
        onClose={() => !submitting && setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isEditing={Boolean(editingGame)}
        submitting={submitting}
        form={form}
        setForm={setForm}
        screens={screens}
        hardwareList={hardwareList}
      />

      <ConfirmModal
        isOpen={Boolean(gameToDelete)}
        onClose={() => setGameToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Game from Catalog"
        message="This removes the game and deletes its thumbnail and cover from Cloudinary. This can't be undone."
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}
