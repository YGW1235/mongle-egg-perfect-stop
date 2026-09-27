import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGameAudio } from '@/game/audio/useGameAudio';
import { useTranslation } from '@/game/localization/LocalizationProvider';

const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy';

type PolicySectionProps = {
  title: string;
  children: ReactNode;
};

function PolicySection({ title, children }: PolicySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: ReactNode }) {
  return <Text style={styles.bullet}>• {children}</Text>;
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { playUiClick } = useGameAudio();
  const { t } = useTranslation();
  const appName = t('app.name');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F3EA" />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('privacy.backLabel')}
          accessibilityRole="button"
          hitSlop={4}
          onPress={() => {
            playUiClick();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/settings');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
          <Ionicons color="#4D3828" name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.title}>{t('privacy.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>{appName}</Text>
          <Text style={styles.introText}>{t('privacy.intro')}</Text>
        </View>

        <PolicySection title={t('privacy.overviewTitle')}>
          <Paragraph>{t('privacy.overviewBody', { appName })}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.storageTitle')}>
          <Paragraph>{t('privacy.storageIntro')}</Paragraph>
          <Bullet>{t('privacy.storageEgg')}</Bullet>
          <Bullet>{t('privacy.storageEnergy')}</Bullet>
          <Bullet>{t('privacy.storageCollection')}</Bullet>
          <Bullet>{t('privacy.storageOnboarding')}</Bullet>
          <Bullet>{t('privacy.storageSettings')}</Bullet>
          <Paragraph>{t('privacy.storageNote')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.accountTitle')}>
          <Paragraph>{t('privacy.accountBody')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.adsTitle')}>
          <Paragraph>{t('privacy.adsBodyOne')}</Paragraph>
          <Paragraph>{t('privacy.adsBodyTwo')}</Paragraph>
          <Pressable
            accessibilityLabel={t('privacy.googlePolicyLabel')}
            accessibilityRole="link"
            onPress={() => {
              playUiClick();
              void Linking.openURL(GOOGLE_PRIVACY_POLICY_URL).catch((error: unknown) => {
                console.warn('Could not open Google privacy policy.', error);
              });
            }}
            style={({ pressed }) => [styles.policyLink, pressed && styles.buttonPressed]}>
            <Text style={styles.policyLinkText}>{t('privacy.googlePolicy')}</Text>
            <Ionicons color="#9A642E" name="open-outline" size={16} />
          </Pressable>
        </PolicySection>

        <PolicySection title={t('privacy.consentTitle')}>
          <Paragraph>{t('privacy.consentBody')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.thirdPartyTitle')}>
          <Paragraph>{t('privacy.thirdPartyBody')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.deletionTitle')}>
          <Paragraph>{t('privacy.deletionBody')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.changesTitle')}>
          <Paragraph>{t('privacy.changesBody')}</Paragraph>
        </PolicySection>

        <PolicySection title={t('privacy.effectiveTitle')}>
          <Paragraph>{t('privacy.effectiveBody')}</Paragraph>
        </PolicySection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3EA' },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E8DCCF',
  },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  title: { fontSize: 17, fontWeight: '900', color: '#4D3828' },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  introCard: {
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: '#FFE8AE',
    borderWidth: 1.5,
    borderColor: '#E5B96A',
  },
  introTitle: { fontSize: 18, fontWeight: '900', color: '#4D3828' },
  introText: { marginTop: 7, fontSize: 13, lineHeight: 20, color: '#715844' },
  section: {
    marginTop: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E8D2B8',
  },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#4D3828' },
  sectionBody: { marginTop: 10, gap: 8 },
  paragraph: { fontSize: 13, lineHeight: 21, color: '#6F5847' },
  bullet: { paddingLeft: 2, fontSize: 13, lineHeight: 20, color: '#6F5847' },
  policyLink: {
    minHeight: 44,
    marginTop: 4,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 22,
    backgroundColor: '#FFF0CA',
    borderWidth: 1,
    borderColor: '#E2B565',
  },
  policyLinkText: { fontSize: 12, fontWeight: '900', color: '#80552E' },
});
