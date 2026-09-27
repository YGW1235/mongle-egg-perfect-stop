import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGameAudio } from '@/game/audio/useGameAudio';
import {
  CREATURES,
  RARITY_COLORS,
  TOTAL_COLLECTION_COUNT,
} from '@/game/collection/creatures';
import { getCollectedCreature } from '@/game/collection/storage';
import type { CollectedCreature, CreatureDefinition } from '@/game/collection/types';
import {
  translateCreatureDescription,
  translateRarity,
} from '@/game/localization/format';
import { useTranslation } from '@/game/localization/LocalizationProvider';
import { useCollection } from '@/hooks/useCollection';

type CreatureCollectionCardProps = {
  creature: CreatureDefinition;
  collected: CollectedCreature | undefined;
};

const CreatureCollectionCard = memo(function CreatureCollectionCard({
  creature,
  collected,
}: CreatureCollectionCardProps) {
  const isDiscovered = collected !== undefined;
  const { t } = useTranslation();

  return (
    <View style={styles.creatureCard}>
      <View style={styles.imageArea}>
        <Image
          source={creature.thumbnail}
          resizeMode="contain"
          style={[styles.creatureImage, !isDiscovered && styles.lockedImage]}
        />
        {!isDiscovered && (
          <View pointerEvents="none" style={styles.lockedOverlay}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        )}
      </View>

      <Text style={styles.collectionNumber}>
        #{String(creature.collectionNumber).padStart(3, '0')}
      </Text>

      {isDiscovered ? (
        <>
          <Text style={styles.creatureName}>{creature.name}</Text>
          <Text
            style={[
              styles.creatureRarity,
              { color: RARITY_COLORS[creature.rarity] },
            ]}>
            {translateRarity(t, creature.rarity)}
          </Text>
          <Text style={styles.creatureDescription}>
            {translateCreatureDescription(t, creature.id, creature.description)}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>×{collected.count}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.creatureName}>???</Text>
          <Text style={styles.lockedRarity}>???</Text>
          <Text style={styles.notDiscovered}>{t('collection.notDiscovered')}</Text>
        </>
      )}
    </View>
  );
});

const getCreatureKey = (creature: CreatureDefinition) => creature.id;

function CollectionFutureCard() {
  const { t } = useTranslation();
  return (
    <View style={styles.futureCard}>
      <Text style={styles.futureIcon}>✨</Text>
      <Text style={styles.futureTitle}>{t('collection.futureTitle')}</Text>
      <Text style={styles.futureDescription}>{t('collection.futureBody')}</Text>
    </View>
  );
}

export default function CollectionScreen() {
  const router = useRouter();
  const { playUiClick } = useGameAudio();
  const { t } = useTranslation();
  const { collection, isHydrated, uniqueCollectedCount } = useCollection();
  const renderCreature = useCallback(
    ({ item }: ListRenderItemInfo<CreatureDefinition>) => (
      <CreatureCollectionCard
        creature={item}
        collected={getCollectedCreature(collection, item.id)}
      />
    ),
    [collection]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F3EA" />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('collection.backLabel')}
          accessibilityRole="button"
          onPress={() => {
            playUiClick();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.titleGroup}>
          <Text style={styles.title}>{t('collection.title')}</Text>
          <Text style={styles.collectionCount}>
            {t('collection.discovered', {
              current: isHydrated ? uniqueCollectedCount : 0,
              total: TOTAL_COLLECTION_COUNT,
            })}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={CREATURES}
        contentContainerStyle={styles.content}
        extraData={collection}
        initialNumToRender={3}
        keyExtractor={getCreatureKey}
        ListFooterComponent={CollectionFutureCard}
        maxToRenderPerBatch={4}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderCreature}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E8DCCF',
  },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  backIcon: { marginTop: -4, fontSize: 34, color: '#493C32' },
  headerSpacer: { width: 40 },
  titleGroup: { alignItems: 'center' },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#493C32',
  },
  collectionCount: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#A09285',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  creatureCard: {
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#FFF9F1',
    borderWidth: 2,
    borderColor: '#ECDCC9',
  },
  imageArea: {
    width: 220,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatureImage: { width: 190, height: 190 },
  lockedImage: { opacity: 0.12 },
  lockedOverlay: {
    position: 'absolute',
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 41,
    backgroundColor: 'rgba(73,60,50,0.82)',
  },
  questionMark: { fontSize: 42, fontWeight: '900', color: '#FFF9F1' },
  collectionNumber: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#A09285',
  },
  creatureName: { marginTop: 4, fontSize: 24, fontWeight: '900', color: '#4D4036' },
  creatureRarity: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#7BAA88',
  },
  lockedRarity: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#B4A79A',
  },
  creatureDescription: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: '#8A7B6E',
  },
  notDiscovered: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#A09285',
  },
  countPill: {
    marginTop: 18,
    minWidth: 58,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 99,
    backgroundColor: '#FFE4A3',
    borderWidth: 1,
    borderColor: '#E8B954',
  },
  countText: { fontSize: 14, fontWeight: '900', color: '#665448' },
  futureCard: {
    marginTop: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E5BE86',
  },
  futureIcon: { fontSize: 22 },
  futureTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
    color: '#4D3828',
  },
  futureDescription: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
    color: '#8A735E',
  },
});
