import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/game/localization/LocalizationProvider';

type ShopComingSoonModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ShopComingSoonModal({
  visible,
  onClose,
}: ShopComingSoonModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View accessibilityViewIsModal style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons color="#9A642E" name="storefront-outline" size={28} />
          </View>
          <Text style={styles.title}>{t('shop.title')}</Text>
          <Text style={styles.description}>{t('shop.body')}</Text>
          <Pressable
            accessibilityLabel={t('shop.closeLabel')}
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.confirmButtonText}>{t('common.ok')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(54, 41, 31, 0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 330,
    padding: 26,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  iconBadge: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFE8B5',
    borderWidth: 1,
    borderColor: '#E8B954',
  },
  title: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '900',
    color: '#4D3828',
  },
  description: {
    marginTop: 13,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#6F5847',
  },
  confirmButton: {
    minWidth: 116,
    minHeight: 44,
    marginTop: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#E9A94E',
    borderWidth: 1,
    borderColor: '#D38C37',
  },
  confirmButtonText: { fontSize: 14, fontWeight: '900', color: '#4D3828' },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
