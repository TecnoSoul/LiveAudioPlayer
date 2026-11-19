// src/stores/radio.js
import { defineStore } from "pinia";
import { Capacitor } from "@capacitor/core";

// Only import AudioPlayer on native platforms
let AudioPlayer = null;
async function loadNativePlayer() {
  if (!AudioPlayer) {
    const module = await import("@mediagrid/capacitor-native-audio");
    AudioPlayer = module.AudioPlayer;
  }
  return AudioPlayer;
}

export const useRadioStore = defineStore("radio", {
  state: () => ({
    currentStation: null,
    isPlaying: false,
    isReady: false,
    isLoading: false,
    error: null,
    audioId: "radioStream",
    // Browser fallback audio element
    browserAudio: null,
    isNative: Capacitor.isNativePlatform(),
    stations: [
      {
        id: 1,
        name: "Big Bang Radio",
        genre: "Variado",
        streamUrl: "https://radios2.tecnosoul.com.ar:8001/bigbang",
        image: "/images/la-512.png",
        location: "Bs. As.",
        social: {},
      },
      {
        id: 2,
        name: "Guayra Radio",
        genre: "Variado",
        streamUrl: "https://radios2.tecnosoul.com.ar:8001/guayraradio",
        image: "/images/512.png",
        location: "Misiones",
        social: {},
      },
      {
        id: 3,
        name: "TXL Radio",
        genre: "Variado",
        streamUrl: "https://radios2.tecnosoul.com.ar:8001/txlradio",
        image: "/images/512.png",
        location: "Argentina",
        social: {},
      },
      {
        id: 4,
        name: "Elektrona Radio",
        genre: "Electrónica",
        streamUrl: "https://radios.tecnosoul.com.ar:8001/elektrona",
        image: "/images/nova-512.png",
        location: "Argentina",
        social: {},
      },
    ],
    favorites: [],
  }),

  actions: {
    async setCurrentStation(station) {
      if (this.currentStation && this.currentStation.id === station.id) {
        return; // Same station, do nothing
      }

      this.currentStation = station;
      this.error = null;

      // Initialize the audio player with the new station
      await this.initializeAudioPlayer();
    },

    async initializeAudioPlayer() {
      if (!this.currentStation || !this.currentStation.streamUrl) {
        this.error = "No hay estación seleccionada";
        return;
      }

      // Reset state for the new station
      this.isLoading = true;
      this.isReady = false;
      this.isPlaying = false;
      this.error = null;

      if (!this.isNative) {
        this.initializeBrowserAudio();
        return;
      }

      try {
        const player = await loadNativePlayer();

        // Release the previous instance (and its listeners) before creating a new one
        try {
          await player.destroy({ audioId: this.audioId });
        } catch (err) {
          // Nothing to destroy on first use
        }

        await player.create({
          audioId: this.audioId,
          audioSource: this.currentStation.streamUrl,
          friendlyTitle: this.currentStation.name,
          useForNotification: true,
          artworkSource: this.currentStation.image,
          isBackgroundMusic: true,
          loop: false,
        });

        await player.initialize({ audioId: this.audioId });

        await player.onPlaybackStatusChange({ audioId: this.audioId }, (result) => {
          this.isPlaying = result.status === "playing";
          if (result.status === "error") {
            this.error = "Error al reproducir la estación";
            this.isPlaying = false;
          }
        });

        await player.onAudioReady({ audioId: this.audioId }, () => {
          this.isReady = true;
          this.isLoading = false;
        });
      } catch (error) {
        console.error("Error initializing native audio player:", error);
        this.error = "No se pudo inicializar el reproductor";
        this.isPlaying = false;
        this.isReady = false;
        this.isLoading = false;
      }
    },

    releaseBrowserAudio() {
      const audio = this.browserAudio;
      if (!audio) return;
      this.browserAudio = null; // listeners below ignore events from stale elements
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },

    initializeBrowserAudio() {
      this.releaseBrowserAudio();

      const audio = new Audio(this.currentStation.streamUrl);
      audio.preload = "none";
      this.browserAudio = audio;
      const isCurrent = () => this.browserAudio === audio;

      audio.addEventListener("playing", () => {
        if (!isCurrent()) return;
        this.isPlaying = true;
        this.isLoading = false;
      });
      audio.addEventListener("pause", () => {
        if (isCurrent()) this.isPlaying = false;
      });
      audio.addEventListener("error", () => {
        if (!isCurrent()) return;
        this.error = "Error al reproducir en el navegador";
        this.isPlaying = false;
        this.isLoading = false;
      });

      // preload = "none": the element is usable immediately; it loads on play()
      this.isReady = true;
      this.isLoading = false;
    },

    async play() {
      if (!this.currentStation) return;

      if (!this.isReady && !this.isLoading) {
        await this.initializeAudioPlayer();
      }

      try {
        if (this.isNative) {
          if (!AudioPlayer || !this.isReady) return; // onAudioReady / events drive the state
          await AudioPlayer.play({ audioId: this.audioId });
        } else if (this.browserAudio) {
          this.isLoading = true;
          await this.browserAudio.play();
        }
        this.error = null;
      } catch (error) {
        console.error("Error starting playback:", error);
        this.error = "Error al reproducir";
        this.isPlaying = false;
        this.isLoading = false;
      }
    },

    async pause() {
      try {
        if (this.isNative) {
          if (AudioPlayer && this.isReady) await AudioPlayer.pause({ audioId: this.audioId });
        } else if (this.browserAudio) {
          this.browserAudio.pause();
        }
      } catch (error) {
        console.error("Error pausing playback:", error);
        this.error = "Error al pausar";
      }
    },

    async togglePlay() {
      if (this.isPlaying) {
        await this.pause();
      } else {
        await this.play();
      }
    },

    async stop() {
      try {
        if (this.isNative) {
          if (AudioPlayer && this.isReady) await AudioPlayer.stop({ audioId: this.audioId });
        } else if (this.browserAudio) {
          this.browserAudio.pause();
          this.browserAudio.currentTime = 0;
        }
        this.isPlaying = false;
      } catch (error) {
        console.error("Error stopping playback:", error);
      }
    },

    toggleFavorite(station) {
      const index = this.favorites.findIndex((f) => f.id === station.id);
      if (index === -1) {
        this.favorites.push(station);
      } else {
        this.favorites.splice(index, 1);
      }
      // TODO: Replace with Capacitor Preferences API
    },

    clearError() {
      this.error = null;
    },
  },

  getters: {
    isFavorite: (state) => (stationId) => {
      return state.favorites.some((f) => f.id === stationId);
    },
    platformInfo: (state) => {
      return state.isNative ? "Native (Android/iOS)" : "Browser";
    },
  },
});