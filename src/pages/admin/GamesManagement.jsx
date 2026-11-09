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
  Check,
  Cpu,
} from "@phosphor-icons/react";
import { gameService } from "../../services/gameService";
import { screenService } from "../../services/screenService";
import { notify } from "../../utils/toastController";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../../components/ui/Sheet";
import api from "../../services/api";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function GamesManagement() {
  const [games, setGames] = useState([]);
  const [screens, setScreens] = useState([]);
  const [hardwareList, setHardwareList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View & Filter States
  const [viewMode, setViewMode] = useState("store"); // "store" | "admin_columns"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  // Modal / Sheet State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    platform: "PS5",
    coverUrl: "",
    availableScreens: [],
    assignedHardware: [],
  });

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (error) {
      notify.error("Failed to load catalog assets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const genres = useMemo(() => {
    const set = new Set(games.map((g) => g.genre).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchQuery = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         g.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre = selectedGenre === "all" || g.genre === selectedGenre;
      return matchQuery && matchGenre;
    });
  }, [games, searchQuery, selectedGenre]);

  const handleOpenCreate = () => {
    setEditingGame(null);
    setFormData({ 
      title: "", 
      genre: "", 
      platform: "PS5", 
      coverUrl: "", 
      availableScreens: [],
      assignedHardware: [] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (game) => {
    setEditingGame(game);
    setFormData({
      title: game.title || "",
      genre: game.genre || "",
      platform: game.platform || "PS5",
      coverUrl: game.coverUrl || "",
      availableScreens: game.availableScreens ? game.availableScreens.map((s) => s._id || s) : [],
      assignedHardware: game.assignedHardware ? game.assignedHardware.map((h) => h._id || h) : [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.genre) {
      notify.error("Please fill in game title and genre");
      return;
    }

    setSubmitting(true);
    try {
      if (editingGame) {
        await gameService.updateGame(editingGame._id, formData);
        notify.success("Game updated successfully");
      } else {
        await gameService.createGame(formData);
        notify.success("Game added to catalog");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to save game");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;
    try {
      await gameService.deleteGame(gameToDelete);
      notify.success("Game removed from catalog");
      fetchData();
    } catch (error) {
      notify.error("Failed to delete game");
    } finally {
      setGameToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  // Drag and drop assignment handler for station matrix
  const handleDragStart = (e, gameId) => {
    e.dataTransfer.setData("gameId", gameId);
  };

  const handleDropOnScreen = async (e, screenId) => {
    e.preventDefault();
    const gameId = e.dataTransfer.getData("gameId");
    if (!gameId) return;

    const game = games.find((g) => g._id === gameId);
    if (!game) return;

    const currentScreens = game.availableScreens ? game.availableScreens.map((s) => s._id || s) : [];
    if (currentScreens.includes(screenId)) return;

    const updatedScreens = [...currentScreens, screenId];
    try {
      await gameService.updateGame(gameId, { availableScreens: updatedScreens });
      notify.success(`Assigned ${game.title} to station successfully`);
      fetchData();
    } catch (error) {
      notify.error("Failed to update screen assignment");
    }
  };

  const handleRemoveFromScreen = async (game, screenId) => {
    const currentScreens = game.availableScreens ? game.availableScreens.map((s) => s._id || s) : [];
    const updatedScreens = currentScreens.filter((id) => id !== screenId);
    try {
      await gameService.updateGame(game._id, { availableScreens: updatedScreens });
      notify.success("Unassigned game from station");
      fetchData();
    } catch (error) {
      notify.error("Failed to update screen assignment");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-border-divider/75 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
            Games Store & Station Manager
          </h1>
          <p className="mt-1 text-xs text-sub sm:text-sm">
            Manage game titles, cover art, hardware links, and station matrix mapping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border-divider bg-app-bg p-1">
            <button
              type="button"
              onClick={() => setViewMode("store")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "store" ? "bg-primary-cyan text-app-bg font-bold shadow-sm" : "text-sub hover:text-main"
              }`}
            >
              <GameController size={14} /> Store View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("admin_columns")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "admin_columns" ? "bg-primary-cyan text-app-bg font-bold shadow-sm" : "text-sub hover:text-main"
              }`}
            >
              <ArrowsLeftRight size={14} /> Station Matrix
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className={`flex h-10 items-center gap-1.5 rounded-xl bg-primary-cyan px-3.5 font-mono text-xs font-bold uppercase tracking-wider text-app-bg shadow-md hover:bg-primary-cyan/90 cursor-pointer ${FOCUS}`}
          >
            <Plus size={15} weight="bold" /> Add Game
          </button>
        </div>
      </div>

      {/* Search & Filters */}
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

      {/* Main Content Area */}
      {loading ? (
        <Loader variant="skeleton-table" lines={5} text="Loading game catalog..." />
      ) : viewMode === "store" ? (
        filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30">
            <GameController size={32} className="text-sub mb-2" />
            <h3 className="text-sm font-bold text-main">No games found</h3>
            <p className="text-xs text-sub mt-0.5">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGames.map((game) => (
              <div
                key={game._id}
                className="group relative bg-card-panel border border-border-divider rounded-2xl overflow-hidden shadow-sm hover:border-primary-cyan/50 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] w-full bg-app-bg overflow-hidden">
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-app-bg to-card-panel p-4 text-center">
                      <GameController size={32} className="text-sub/50 mb-2" />
                      <span className="text-xs font-bold text-sub">{game.title}</span>
                    </div>
                  )}

                  <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/70 backdrop-blur-md px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-white/20">
                    {game.platform || "PS5"}
                  </span>

                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(game)}
                      className="size-7 rounded-lg bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary-cyan hover:text-app-bg transition-colors cursor-pointer"
                    >
                      <PencilSimple size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setGameToDelete(game._id); setDeleteModalOpen(true); }}
                      className="size-7 rounded-lg bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-main truncate">{game.title}</h3>
                    <p className="text-[10px] text-sub">{game.genre}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border-divider/50">
                    {game.availableScreens && game.availableScreens.length > 0 ? (
                      game.availableScreens.map((s) => (
                        <span key={s._id || s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-app-bg border border-border-divider text-main">
                          {s.name || "Station"}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-sub italic">No stations</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Station Matrix & Drag-Drop Column Assignment */
        <div className="space-y-4">
          <div className="bg-primary-cyan/10 border border-primary-cyan/30 p-3 rounded-2xl flex items-center justify-between text-xs text-primary-cyan font-mono">
            <span>✨ Drag games from the library and drop them into station columns to map them instantly.</span>
            <span className="font-bold">Matrix Edit Active</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
            <div className="bg-card-panel border border-border-divider rounded-2xl p-4 space-y-3 min-h-[400px]">
              <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                <GameController size={14} className="text-primary-cyan" /> Game Library ({games.length})
              </h3>
              <p className="text-[11px] text-sub">Drag any game card into station columns.</p>

              <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {games.map((game) => (
                  <div
                    key={game._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, game._id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-app-bg border border-border-divider cursor-grab active:cursor-grabbing hover:border-primary-cyan/50 transition-all shadow-sm"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-bold text-main truncate">{game.title}</p>
                      <p className="text-[10px] text-sub">{game.genre}</p>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-card-panel border border-border-divider text-sub">
                      {game.platform || "PS5"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {screens.map((screen) => {
                const assignedGames = games.filter((g) =>
                  g.availableScreens?.some((s) => (s._id || s) === screen._id)
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
                            <p className="text-[11px] text-sub italic">Drop games here to assign to {screen.name}</p>
                          </div>
                        ) : (
                          assignedGames.map((game) => (
                            <div
                              key={game._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-app-bg border border-border-divider shadow-sm group"
                            >
                              <span className="text-xs font-bold text-main truncate pr-2">{game.title}</span>
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

      {/* Add / Edit Game Sheet (with Screen & Hardware Links) */}
      <Sheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGame ? "Edit Game Details" : "Add New Game"}
        description="Configure cover art, metadata, station screens, and console hardware links."
        footer={
          <button type="submit" form="game-form" disabled={submitting} className={PRIMARY_BTN}>
            {submitting ? "Saving..." : editingGame ? "Save Changes" : "Create Game"}
          </button>
        }
      >
        <form id="game-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-main">Game Title</label>
            <input
              type="text"
              required
              placeholder="e.g., EA Sports FC 25"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Genre</label>
              <input
                type="text"
                required
                placeholder="e.g., Sports, Racing"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                <option value="PS5">PlayStation 5</option>
                <option value="SimDrive">SimDrive Wheel</option>
                <option value="PC">PC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-main">Cover Poster Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          {/* Linked Screens */}
          <div>
            <label className="mb-2 block text-xs font-medium text-main">Assigned Stations / Screens</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-divider bg-app-bg p-3">
              {screens.map((screen) => {
                const isSelected = formData.availableScreens.includes(screen._id);
                return (
                  <button
                    type="button"
                    key={screen._id}
                    onClick={() => {
                      const updated = isSelected
                        ? formData.availableScreens.filter((id) => id !== screen._id)
                        : [...formData.availableScreens, screen._id];
                      setFormData({ ...formData, availableScreens: updated });
                    }}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary-cyan bg-primary-cyan/10 text-primary-cyan"
                        : "border-border-divider bg-card-panel text-sub hover:text-main"
                    }`}
                  >
                    <span>{screen.name}</span>
                    {isSelected && <Check size={14} weight="bold" className="text-primary-cyan" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Linked Hardware Assets (PS5 Consoles / Peripherals) */}
          <div>
            <label className="mb-2 block text-xs font-medium text-main flex items-center gap-1.5">
              <Cpu size={14} className="text-primary-cyan" /> Assigned Hardware Assets (Consoles / Peripherals)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-border-divider bg-app-bg p-3 max-h-40 overflow-y-auto">
              {hardwareList.map((hw) => {
                const isSelected = formData.assignedHardware.includes(hw._id);
                return (
                  <button
                    type="button"
                    key={hw._id}
                    onClick={() => {
                      const updated = isSelected
                        ? formData.assignedHardware.filter((id) => id !== hw._id)
                        : [...formData.assignedHardware, hw._id];
                      setFormData({ ...formData, assignedHardware: updated });
                    }}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary-cyan bg-primary-cyan/10 text-primary-cyan"
                        : "border-border-divider bg-card-panel text-sub hover:text-main"
                    }`}
                  >
                    <div className="text-left truncate pr-1">
                      <p className="font-bold truncate">{hw.name}</p>
                      <p className="text-[10px] text-sub">{hw.assetId} • {hw.station}</p>
                    </div>
                    {isSelected && <Check size={14} weight="bold" className="text-primary-cyan shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Game from Catalog"
        message="Are you sure you want to remove this game? This action cannot be undone."
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}