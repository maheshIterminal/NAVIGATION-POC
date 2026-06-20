import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useOfferCountdown } from '../hooks/useOrderOffer';
import { useOfferAlertSound } from '../hooks/useOfferAlertSound';
import { useDriverSession } from '../providers/DriverSessionProvider';
import { offerModalStyles as styles } from '../constants/theme';
import { formatAud } from '../utils/currency';

export function OfferModal() {
  const { activeOffer, acceptOffer, declineOffer, clearOffer } = useDriverSession();
  useOfferAlertSound(activeOffer);
  const secondsLeft = useOfferCountdown(activeOffer?.expiresAt ?? null);

  useEffect(() => {
    if (!activeOffer) return;

    const expiresAtMs = new Date(activeOffer.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) return;

    // Only dismiss after the offer has actually expired, not on the initial 0 state.
    if (secondsLeft === 0 && Date.now() >= expiresAtMs) {
      clearOffer();
    }
  }, [activeOffer, secondsLeft, clearOffer]);

  if (!activeOffer) return null;

  const progress = Math.max(0, Math.min(1, secondsLeft / 30));

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.badge}>New delivery offer</Text>
          <Text style={styles.merchant}>{activeOffer.merchantName}</Text>
          <Text style={styles.earnings}>{formatAud(activeOffer.earnings)}</Text>

          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.addressText}>{activeOffer.pickup.address}</Text>
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Dropoff</Text>
            <Text style={styles.addressText}>{activeOffer.dropoff.address}</Text>
          </View>

          <View style={styles.timerRow}>
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.timerText}>{secondsLeft}s</Text>
          </View>

          <Pressable style={styles.acceptButton} onPress={() => void acceptOffer()}>
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.declineButton} onPress={() => void declineOffer()}>
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
