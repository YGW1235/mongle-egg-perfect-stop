import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAdsConsent } from '@/game/ads/consent';
import { useAdsDiagnostics } from '@/game/ads/diagnostics';
import { useGameAudio } from '@/game/audio/useGameAudio';
import { useTranslation } from '@/game/localization/LocalizationProvider';
import type {
  BooleanGameSettingKey,
  LanguagePreference,
} from '@/game/settings/types';
import { useGameSettings } from '@/hooks/useGameSettings';

type ToggleRowProps = {
  label: string;
  settingKey: BooleanGameSettingKey;
  value: boolean;
  disabled: boolean;
  onChange: (key: BooleanGameSettingKey, enabled: boolean) => void;
  onPressInfo?: () => void;
};

function ToggleRow({
  label,
  settingKey,
  value,
  disabled,
  onChange,
  onPressInfo,
}: ToggleRowProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        <Text style={styles.rowLabel}>{label}</Text>
        {onPressInfo ? (
          <Pressable
            accessibilityLabel={t('settings.guideInfoLabel')}
            accessibilityRole="button"
            hitSlop={2}
            onPress={onPressInfo}
            style={({ pressed }) => [
              styles.infoButton,
              pressed && styles.infoButtonPressed,
            ]}>
            <Ionicons
              color="#9A6C42"
              name="information-circle-outline"
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={t('settings.toggleLabel', { label })}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        ios_backgroundColor="#D8CCBF"
        onValueChange={(enabled) => onChange(settingKey, enabled)}
        thumbColor={value ? '#FFF9E8' : '#F7F1E8'}
        trackColor={{ false: '#D8CCBF', true: '#E9A94E' }}
        value={value}
      />
    </View>
  );
}

type LanguageOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function LanguageOption({ label, selected, onPress }: LanguageOptionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageOption,
        selected && styles.languageOptionSelected,
        pressed && styles.rowPressed,
      ]}>
      <Text style={styles.languageOptionText}>{label}</Text>
      <Ionicons
        color={selected ? '#D38C37' : '#B8AA9D'}
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={21}
      />
    </Pressable>
  );
}

function formatDiagnosticValue(value: boolean | string | number | null) {
  if (value === null) return 'unknown';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function DiagnosticRow({
  label,
  value,
}: {
  label: string;
  value: boolean | string | number | null;
}) {
  return (
    <View style={styles.diagnosticRow}>
      <Text style={styles.diagnosticLabel}>{label}</Text>
      <Text selectable style={styles.diagnosticValue}>
        {formatDiagnosticValue(value)}
      </Text>
    </View>
  );
}

function AdDiagnosticsSection() {
  const diagnostics = useAdsDiagnostics();

  return (
    <>
      <Text style={styles.sectionTitle}>AD DIAGNOSTICS</Text>
      <View style={styles.diagnosticsCard}>
        <DiagnosticRow label="DEV" value={diagnostics.isDev} />
        <DiagnosticRow
          label="consentImplementation"
          value={diagnostics.consentImplementation}
        />
        <DiagnosticRow label="providerMounted" value={diagnostics.providerMounted} />
        <DiagnosticRow
          label="bootstrapEffectStarted"
          value={diagnostics.bootstrapEffectStarted}
        />
        <DiagnosticRow label="TestIds.REWARDED" value={diagnostics.isTestRewarded} />
        <DiagnosticRow
          label="explicit UMP EEA debug"
          value={diagnostics.isExplicitUmpDebug}
        />
        <DiagnosticRow
          label="consent bootstrap started"
          value={diagnostics.consentBootstrapStarted}
        />
        <DiagnosticRow label="gatherConsent" value={diagnostics.gatherConsentState} />
        <DiagnosticRow
          label="gather error code"
          value={diagnostics.gatherConsentErrorCode}
        />
        <DiagnosticRow
          label="gather error message"
          value={diagnostics.gatherConsentErrorMessage}
        />
        <DiagnosticRow label="getConsentInfo" value={diagnostics.getConsentInfoState} />
        <DiagnosticRow label="consentStatus" value={diagnostics.consentStatus} />
        <DiagnosticRow label="canRequestAds" value={diagnostics.canRequestAds} />
        <DiagnosticRow
          label="privacyOptionsRequirementStatus"
          value={diagnostics.privacyOptionsRequirementStatus}
        />
        <View style={styles.diagnosticGroupDivider} />
        <Text style={styles.diagnosticGroupTitle}>DEV FALLBACK CONDITIONS</Text>
        <DiagnosticRow label="isDev" value={diagnostics.isDev} />
        <DiagnosticRow label="isTestRewarded" value={diagnostics.isTestRewarded} />
        <DiagnosticRow
          label="isExplicitUmpDebug"
          value={diagnostics.isExplicitUmpDebug}
        />
        <DiagnosticRow
          label="gatherConsentFailed"
          value={diagnostics.gatherConsentFailed}
        />
        <DiagnosticRow label="canRequestAds" value={diagnostics.canRequestAds} />
        <DiagnosticRow
          label="devFallbackAllowed"
          value={diagnostics.devFallbackAllowed}
        />
        <View style={styles.diagnosticGroupDivider} />
        <DiagnosticRow
          label="Mobile Ads initialize"
          value={diagnostics.mobileAdsInitializationState}
        />
        <DiagnosticRow
          label="consent provider"
          value={diagnostics.consentProviderState}
        />
        <DiagnosticRow label="Rewarded" value={diagnostics.rewardedState} />
        <DiagnosticRow
          label="rewarded error code"
          value={diagnostics.rewardedLoadErrorCode}
        />
        <DiagnosticRow
          label="rewarded error message"
          value={diagnostics.rewardedLoadErrorMessage}
        />
      </View>
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { playUiClick } = useGameAudio();
  const { t } = useTranslation();
  const { settings, isHydrated, setSetting } = useGameSettings();
  const {
    privacyOptionsRequired,
    isPrivacyOptionsBusy,
    showPrivacyOptions,
  } = useAdsConsent();
  const [isAppInfoVisible, setIsAppInfoVisible] = useState(false);
  const [isHardModeInfoVisible, setIsHardModeInfoVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const appName = t('app.name');
  const version = Constants.expoConfig?.version ?? t('settings.unavailable');
  const languagePreferenceLabels: Record<LanguagePreference, string> = {
    system: t('language.systemValue'),
    ko: t('language.korean'),
    en: t('language.english'),
  };
  const handleSettingChange = (
    key: BooleanGameSettingKey,
    enabled: boolean
  ) => {
    playUiClick();
    setSetting(key, enabled);
  };
  const selectLanguage = (preference: LanguagePreference) => {
    playUiClick();
    setSetting('languagePreference', preference);
    setIsLanguageModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F3EA" />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('settings.backLabel')}
          accessibilityRole="button"
          hitSlop={4}
          onPress={() => {
            playUiClick();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
          <Ionicons color="#4D3828" name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('settings.gameSection')}</Text>
        <View style={styles.card}>
          <ToggleRow
            disabled={!isHydrated}
            label={t('settings.haptics')}
            onChange={handleSettingChange}
            settingKey="hapticsEnabled"
            value={settings.hapticsEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            disabled={!isHydrated}
            label={t('settings.soundEffects')}
            onChange={handleSettingChange}
            settingKey="sfxEnabled"
            value={settings.sfxEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            disabled={!isHydrated}
            label={t('settings.backgroundMusic')}
            onChange={handleSettingChange}
            settingKey="bgmEnabled"
            value={settings.bgmEnabled}
          />
          <View style={styles.divider} />
          <ToggleRow
            disabled={!isHydrated}
            label={t('settings.guideRing')}
            onChange={handleSettingChange}
            onPressInfo={() => {
              playUiClick();
              setIsHardModeInfoVisible(true);
            }}
            settingKey="guideRingEnabled"
            value={settings.guideRingEnabled}
          />
          <View style={styles.divider} />
          <Pressable
            accessibilityLabel={t('language.openLabel')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isHydrated }}
            disabled={!isHydrated}
            onPress={() => {
              playUiClick();
              setIsLanguageModalVisible(true);
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
            <View style={styles.languageValueGroup}>
              <Text numberOfLines={1} style={styles.languageValue}>
                {languagePreferenceLabels[settings.languagePreference]}
              </Text>
              <Ionicons color="#8A735E" name="chevron-forward" size={18} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('settings.infoSection')}</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityLabel={t('settings.openPrivacyLabel')}
            accessibilityRole="button"
            onPress={() => {
              playUiClick();
              router.push('/privacy');
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.rowLabel}>{t('settings.privacyPolicy')}</Text>
            <Ionicons color="#8A735E" name="chevron-forward" size={18} />
          </Pressable>
          <View style={styles.divider} />
          {privacyOptionsRequired ? (
            <>
              <Pressable
                accessibilityLabel={t('settings.openAdPrivacyLabel')}
                accessibilityRole="button"
                accessibilityState={{ disabled: isPrivacyOptionsBusy }}
                disabled={isPrivacyOptionsBusy}
                onPress={() => {
                  playUiClick();
                  void showPrivacyOptions();
                }}
                style={({ pressed }) => [
                  styles.row,
                  isPrivacyOptionsBusy && styles.busyRow,
                  pressed && styles.rowPressed,
                ]}>
                <Text style={styles.rowLabel}>{t('settings.adPrivacy')}</Text>
                <View style={styles.infoValue}>
                  {isPrivacyOptionsBusy ? (
                    <Text style={styles.busyText}>{t('settings.opening')}</Text>
                  ) : null}
                  <Ionicons color="#8A735E" name="chevron-forward" size={18} />
                </View>
              </Pressable>
              <View style={styles.divider} />
            </>
          ) : null}
          <Pressable
            accessibilityLabel={t('settings.openAppInfoLabel')}
            accessibilityRole="button"
            onPress={() => {
              playUiClick();
              setIsAppInfoVisible(true);
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.rowLabel}>{t('settings.appInfo')}</Text>
            <Ionicons color="#8A735E" name="chevron-forward" size={18} />
          </Pressable>
        </View>

        {__DEV__ ? <AdDiagnosticsSection /> : null}

        <Text style={styles.version}>{t('settings.version', { version })}</Text>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsAppInfoVisible(false)}
        transparent
        visible={isAppInfoVisible}>
        <View accessibilityViewIsModal style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.appIconBadge}>
              <Ionicons color="#9A642E" name="egg-outline" size={28} />
            </View>
            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.appVersion}>
              {t('settings.version', { version })}
            </Text>
            <Pressable
              accessibilityLabel={t('settings.closeAppInfoLabel')}
              accessibilityRole="button"
              onPress={() => {
                playUiClick();
                setIsAppInfoVisible(false);
              }}
              style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}>
              <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          playUiClick();
          setIsHardModeInfoVisible(false);
        }}
        transparent
        visible={isHardModeInfoVisible}>
        <View accessibilityViewIsModal style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.hardModeModalCard]}>
            <View style={styles.hardModeIconBadge}>
              <Ionicons
                color="#9A642E"
                name="information-circle-outline"
                size={28}
              />
            </View>
            <Text style={styles.hardModeTitle}>{t('settings.hardModeTitle')}</Text>
            <Text style={styles.hardModeDescription}>
              {t('settings.hardModeBody')}
            </Text>
            <Pressable
              accessibilityLabel={t('settings.closeHardModeLabel')}
              accessibilityRole="button"
              onPress={() => {
                playUiClick();
                setIsHardModeInfoVisible(false);
              }}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          playUiClick();
          setIsLanguageModalVisible(false);
        }}
        transparent
        visible={isLanguageModalVisible}>
        <View accessibilityViewIsModal style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.languageModalCard]}>
            <Text style={styles.languageModalTitle}>{t('language.modalTitle')}</Text>
            <View accessibilityRole="radiogroup" style={styles.languageOptions}>
              <LanguageOption
                label={t('language.system')}
                onPress={() => selectLanguage('system')}
                selected={settings.languagePreference === 'system'}
              />
              <LanguageOption
                label={t('language.korean')}
                onPress={() => selectLanguage('ko')}
                selected={settings.languagePreference === 'ko'}
              />
              <LanguageOption
                label={t('language.english')}
                onPress={() => selectLanguage('en')}
                selected={settings.languagePreference === 'en'}
              />
            </View>
            <Pressable
              accessibilityLabel={t('language.closeLabel')}
              accessibilityRole="button"
              onPress={() => {
                playUiClick();
                setIsLanguageModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  title: { fontSize: 19, fontWeight: '900', color: '#4D3828' },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 9,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#9A6C42',
  },
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E8D2B8',
  },
  row: {
    minHeight: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: { backgroundColor: '#FFF4E3' },
  rowLabelGroup: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowLabel: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: '#4D3828' },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  infoButtonPressed: { backgroundColor: '#FFF0D8', opacity: 0.78 },
  divider: { height: 1, marginHorizontal: 18, backgroundColor: '#EFE3D6' },
  busyRow: { opacity: 0.62 },
  infoValue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  languageValueGroup: {
    maxWidth: '55%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  languageValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#8A735E',
  },
  busyText: { fontSize: 12, fontWeight: '700', color: '#A09285' },
  diagnosticsCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#332B26',
    borderWidth: 1,
    borderColor: '#5C4D43',
  },
  diagnosticRow: {
    minHeight: 30,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  diagnosticLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: '#D8C8BA',
  },
  diagnosticValue: {
    flex: 1.35,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#FFE39A',
  },
  diagnosticGroupDivider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: '#5C4D43',
  },
  diagnosticGroupTitle: {
    marginBottom: 3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#E9A94E',
  },
  version: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#A09285',
  },
  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(54, 41, 31, 0.42)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    padding: 26,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#DDAA70',
    shadowColor: '#4D3828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  hardModeModalCard: { alignItems: 'stretch', borderColor: '#D99A52' },
  hardModeIconBadge: {
    width: 52,
    height: 52,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFE8B5',
  },
  hardModeTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#4D3828',
  },
  hardModeDescription: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#4D3828',
  },
  languageModalCard: { alignItems: 'stretch', borderColor: '#D99A52' },
  languageModalTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: '#4D3828',
  },
  languageOptions: { marginTop: 18, gap: 8 },
  languageOption: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E8DCCF',
  },
  languageOptionSelected: {
    backgroundColor: '#FFF0D8',
    borderColor: '#D99A52',
  },
  languageOptionText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#4D3828',
  },
  appIconBadge: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#FFE5A5',
    borderWidth: 1,
    borderColor: '#E4B45D',
  },
  appName: { marginTop: 15, fontSize: 20, fontWeight: '900', color: '#4D3828' },
  appVersion: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#8A735E' },
  closeButton: {
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
  closeButtonText: { fontSize: 14, fontWeight: '900', color: '#4D3828' },
});
