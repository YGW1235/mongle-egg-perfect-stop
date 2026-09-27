import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/game/localization/LocalizationProvider';

type OnboardingOverlayProps =
  | {
      phase: 'rules';
      onContinue: () => void;
    }
  | {
      phase: 'resources';
      onContinue: () => void;
    }
  | {
      phase: 'collection-guide';
    };

export function OnboardingOverlay(props: OnboardingOverlayProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="none" onPress={() => {}} style={styles.scrim} />

      {props.phase === 'rules' ? (
        <View style={styles.rulesCard}>
          <Text style={styles.eyebrow}>{t('onboarding.howTo')}</Text>
          <Text style={styles.title}>{t('onboarding.rulesTitle')}</Text>
          <Text style={styles.body}>{t('onboarding.rulesBody')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={props.onContinue}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      ) : null}

      {props.phase === 'resources' ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={props.onContinue}
            style={({ pressed }) => [styles.bottomAction, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{t('onboarding.gotIt')}</Text>
          </Pressable>
        </>
      ) : null}

      {props.phase === 'collection-guide' ? (
        <View pointerEvents="none" style={styles.collectionCard}>
          <Text style={styles.eyebrow}>{t('onboarding.collection')}</Text>
          <Text style={styles.collectionTitle}>
            {t('onboarding.collectionTitle')}
          </Text>
          <Text style={styles.body}>{t('onboarding.collectionBody')}</Text>
          <Text style={styles.collectionAction}>
            {t('onboarding.collectionAction')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 25, 20, 0.5)',
  },
  rulesCard: {
    width: '88%',
    maxWidth: 390,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: '#B87332',
  },
  title: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '900',
    color: '#4D3828',
  },
  body: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#6F5847',
  },
  actionButton: {
    width: '100%',
    height: 58,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F0A84A',
  },
  bottomAction: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    left: 20,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F0A84A',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#553A24',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  collectionCard: {
    position: 'absolute',
    top: 104,
    width: '88%',
    maxWidth: 390,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  collectionTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '900',
    color: '#4D3828',
  },
  collectionAction: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#D7862F',
  },
});
