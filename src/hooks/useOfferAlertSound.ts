import { useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { OrderOffer } from '../types/order';

const OFFER_ALERT_SOURCE = require('../../assets/sounds/offer-alert.mp3');

let audioModeConfigured = false;

async function ensureOfferAudioMode(): Promise<void> {
  if (audioModeConfigured) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
  audioModeConfigured = true;
}

export function useOfferAlertSound(activeOffer: OrderOffer | null): void {
  const player = useAudioPlayer(OFFER_ALERT_SOURCE);
  const playingOfferIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOffer) {
      playingOfferIdRef.current = null;
      try {
        player.pause();
        player.loop = false;
      } catch {
        // Player may already be released on unmount.
      }
      return;
    }

    if (playingOfferIdRef.current === activeOffer.offerId) {
      return;
    }

    playingOfferIdRef.current = activeOffer.offerId;

    let cancelled = false;

    async function startAlert() {
      try {
        await ensureOfferAudioMode();
        if (cancelled) return;

        player.loop = true;
        player.volume = 1;
        player.play();
      } catch {
        // Audio is optional; haptics still alert the driver.
      }
    }

    void startAlert();

    return () => {
      cancelled = true;
      try {
        player.pause();
        player.loop = false;
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [activeOffer, player]);
}
