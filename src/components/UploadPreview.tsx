import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors, font } from '@/lib/theme';

export type UploadPreviewState = {
  /** Local or remote image URI to display. */
  uri: string;
  title: string;
  status: 'uploading' | 'done' | 'error';
  message?: string;
};

/**
 * Full-screen preview shown after picking a photo: displays the image,
 * upload progress, and a confirmation once the upload finishes.
 */
export function UploadPreview({
  preview,
  onClose,
}: {
  preview: UploadPreviewState | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (preview) setVisible(true);
  }, [preview]);

  const close = () => {
    setVisible(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[font.h3, { marginBottom: 12 }]}>{preview?.title ?? 'Upload'}</Text>

          {preview?.uri ? (
            <Image source={{ uri: preview.uri }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="document-outline" size={48} color={colors.subtle} />
            </View>
          )}

          <View style={styles.statusRow}>
            {preview?.status === 'uploading' && (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[font.small, { color: colors.muted }]}>Uploading…</Text>
              </>
            )}
            {preview?.status === 'done' && (
              <>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[font.small, { color: colors.success, fontWeight: '600' }]}>Uploaded successfully</Text>
              </>
            )}
            {preview?.status === 'error' && (
              <>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[font.small, { color: colors.danger }]}>{preview.message ?? 'Upload failed'}</Text>
              </>
            )}
          </View>

          <Button
            title={preview?.status === 'uploading' ? 'Please wait…' : 'Done'}
            onPress={close}
            disabled={preview?.status === 'uploading'}
            style={{ alignSelf: 'stretch', marginTop: 8 }}
          />
          {preview?.status !== 'uploading' && (
            <Pressable onPress={close} style={{ alignSelf: 'center', marginTop: 10 }} hitSlop={8}>
              <Text style={[font.small, { color: colors.muted }]}>Close</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    minHeight: 22,
  },
});
