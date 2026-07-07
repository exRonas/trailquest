import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { AppText, Button } from './ui';
import { colors, spacing } from '../theme';
import { useT } from '../i18n';

interface QRScannerModalProps {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
}

type PermState = 'checking' | 'granted' | 'denied';

/**
 * Full-screen camera modal that scans a checkpoint QR. Uses react-native-camera-
 * kit's built-in barcode scanner (`scanBarcode`). Fires `onScanned` exactly once
 * per open (guarded by a ref) so a single QR doesn't trigger many requests.
 */
export function QRScannerModal({
  visible,
  onScanned,
  onClose,
}: QRScannerModalProps): React.ReactElement {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [perm, setPerm] = useState<PermState>('checking');
  const handledRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      handledRef.current = false;
      setPerm('checking');
      return;
    }
    let cancelled = false;
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('scan.cameraDeniedTitle'),
            message: t('scan.cameraDeniedMsg'),
            buttonPositive: 'OK',
          },
        );
        if (!cancelled) {
          setPerm(
            granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
          );
        }
      } else {
        // iOS asks via the native camera view itself.
        if (!cancelled) setPerm('granted');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, t]);

  const handleCode = (value: string | undefined) => {
    if (handledRef.current || !value) return;
    handledRef.current = true;
    onScanned(value);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        {perm === 'granted' ? (
          <Camera
            style={StyleSheet.absoluteFill}
            cameraType={CameraType.Back}
            scanBarcode
            showFrame
            laserColor={colors.accent}
            frameColor={colors.surface}
            allowedBarcodeTypes={['qr']}
            scanThrottleDelay={1500}
            onReadCode={(e) => handleCode(e.nativeEvent.codeStringValue)}
          />
        ) : perm === 'denied' ? (
          <View style={styles.centered}>
            <Icon name="camera-off-outline" size={48} color={colors.textInverse} />
            <AppText variant="subheading" color={colors.textInverse} style={styles.deniedTitle}>
              {t('scan.cameraDeniedTitle')}
            </AppText>
            <AppText variant="callout" color={colors.textInverse} style={styles.deniedMsg}>
              {t('scan.cameraDeniedMsg')}
            </AppText>
          </View>
        ) : (
          <View style={styles.centered} />
        )}

        {/* Hint */}
        {perm === 'granted' ? (
          <View style={[styles.hint, { bottom: insets.bottom + 110 }]} pointerEvents="none">
            <AppText variant="callout" color={colors.textInverse} style={styles.hintText}>
              {t('scan.hint')}
            </AppText>
          </View>
        ) : null}

        {/* Close */}
        <Pressable
          style={[styles.closeBtn, { top: insets.top + spacing.md }]}
          onPress={onClose}
          hitSlop={12}
        >
          <Icon name="close" size={26} color={colors.textInverse} />
        </Pressable>

        <View style={[styles.cancelBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button label={t('scan.cancel')} variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  centered: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  deniedTitle: { marginTop: spacing.lg, textAlign: 'center' },
  deniedMsg: { marginTop: spacing.sm, textAlign: 'center', opacity: 0.85 },
  hint: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  hintText: {
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 0,
  },
});
