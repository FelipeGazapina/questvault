import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Button, Card, Field, Frame, Num, Slot, Sprite, Toggle } from "@/components/ui";
import { brl, formatMinutes, T } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ErrorText,
  formatTimeInput,
  isValidTime,
  OptionSheet,
  Price,
  SettingRow,
  Sheet,
  toInt,
  useBusy,
  ValueButton,
} from "./kit";

type Catalog = FunctionReturnType<typeof api.rewards.catalog>;
type Item = Catalog["items"][number];
type Pack = Catalog["packs"][number];
type Settings = Catalog["settings"];
type Purchase = FunctionReturnType<typeof api.rewards.pendingPurchases>[number];

// ─── Pending deliveries ───────────────────────────────────────────────────

export function PurchaseRow({ p }: { p: Purchase }) {
  const { t } = useTranslation();
  const markDelivered = useMutation(api.rewards.markDelivered);
  const { busy, error, run } = useBusy();
  const ago = timeAgo(t, p.createdAt);
  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.rowCenter}>
        <Sprite name={p.kind === "mission" ? "chestOpen" : "stall"} width={30} />
        <View style={{ flex: 1, gap: 2 }}>
          <Body size={15} weight="bold">
            {t("guardian.rewards.bought", { name: p.adventurerName, title: p.title })}
          </Body>
          <Body size={13} color={T.muted}>
            {p.priceCoins > 0 ? t("guardian.rewards.boughtFor", { price: p.priceCoins, ago }) : t("guardian.rewards.missionPrize", { ago })}
          </Body>
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
      <Button
        label={t("guardian.rewards.markDelivered")}
        variant="ghost"
        icon="check"
        busy={busy}
        onPress={() => void run(() => markDelivered({ purchaseId: p._id }))}
      />
    </Card>
  );
}

// ─── Items ────────────────────────────────────────────────────────────────

function ItemEditor({ item, onDone }: { item: Item | null; onDone: () => void }) {
  const { t } = useTranslation();
  const save = useMutation(api.rewards.saveItem);
  const [title, setTitle] = useState(item?.title ?? "");
  const [price, setPrice] = useState(item ? String(item.priceCoins) : "");
  const { busy, error, setError, run } = useBusy();

  async function submit() {
    if (!title.trim() || toInt(price) <= 0) {
      setError(t("guardian.rewards.invalid"));
      return;
    }
    const ok = await run(() =>
      save({ itemId: item?._id, title: title.trim(), priceCoins: toInt(price), active: item?.active ?? true }),
    );
    if (ok) onDone();
  }

  return (
    <Card highlight={T.brass} style={{ gap: 12 }}>
      <Field
        label={t("guardian.rewards.itemName")}
        placeholder={t("guardian.rewards.itemNamePlaceholder")}
        value={title}
        onChangeText={setTitle}
        maxLength={60}
        autoFocus
      />
      <Field label={t("guardian.rewards.price")} value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={5} />
      <ErrorText>{error}</ErrorText>
      <View style={styles.pair}>
        <Button label={t("actions.cancel")} variant="ghost" onPress={onDone} style={{ flex: 1 }} />
        <Button label={t("actions.save")} busy={busy} onPress={() => void submit()} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

export function ItemsSection({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const save = useMutation(api.rewards.saveItem);
  const [editing, setEditing] = useState<Id<"shopItems"> | "new" | null>(null);

  return (
    <View style={{ gap: 8 }}>
      {items.length === 0 && editing !== "new" ? (
        <Body size={14} color={T.muted} center>
          {t("guardian.rewards.noItems")}
        </Body>
      ) : null}
      {items.map((it) =>
        editing === it._id ? (
          <ItemEditor key={it._id} item={it} onDone={() => setEditing(null)} />
        ) : (
          <Card key={it._id} style={[styles.item, !it.active && { opacity: 0.7 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("guardian.rewards.editItem", { title: it.title })}
              onPress={() => setEditing(it._id)}
              style={[styles.rowCenter, { flex: 1 }]}
            >
              <Slot size={48}>
                <Sprite name="chest" width={36} />
              </Slot>
              <View style={{ flex: 1, gap: 3 }}>
                <Body size={16} weight="bold">
                  {it.title}
                </Body>
                <Price coins={it.priceCoins} />
              </View>
            </Pressable>
            <Toggle
              value={it.active}
              onChange={(v) => void save({ itemId: it._id, title: it.title, priceCoins: it.priceCoins, active: v })}
              label={t("guardian.rewards.itemActive", { title: it.title })}
            />
          </Card>
        ),
      )}
      {editing === "new" ? (
        <ItemEditor item={null} onDone={() => setEditing(null)} />
      ) : (
        <Button label={t("guardian.rewards.newItem")} variant="ghost" icon="plus" onPress={() => setEditing("new")} />
      )}
    </View>
  );
}

// ─── Time packs ───────────────────────────────────────────────────────────

function PackEditor({ pack, onDone }: { pack: Pack | null; onDone: () => void }) {
  const { t } = useTranslation();
  const save = useMutation(api.rewards.savePack);
  const remove = useMutation(api.rewards.deletePack);
  const [minutes, setMinutes] = useState(pack ? String(pack.minutes) : "");
  const [price, setPrice] = useState(pack ? String(pack.priceCoins) : "");
  const [active, setActive] = useState(pack?.active ?? true);
  const { busy, error, setError, run } = useBusy();

  async function submit() {
    if (toInt(minutes) <= 0 || toInt(price) <= 0) {
      setError(t("guardian.rewards.invalid"));
      return;
    }
    const ok = await run(() => save({ packId: pack?._id, minutes: toInt(minutes), priceCoins: toInt(price), active }));
    if (ok) onDone();
  }

  return (
    <Card highlight={T.timeFill} style={{ gap: 12 }}>
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Field label={t("guardian.rewards.minutes")} value={minutes} onChangeText={(v) => setMinutes(v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={3} autoFocus />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("guardian.rewards.price")} value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={5} />
        </View>
      </View>
      <SettingRow last title={t("guardian.rewards.onSale")} right={<Toggle value={active} onChange={setActive} label={t("guardian.rewards.onSale")} />} />
      <ErrorText>{error}</ErrorText>
      <View style={styles.pair}>
        <Button label={t("actions.cancel")} variant="ghost" onPress={onDone} style={{ flex: 1 }} />
        <Button label={t("actions.save")} busy={busy} onPress={() => void submit()} style={{ flex: 1 }} />
      </View>
      {pack ? (
        <Button
          label={t("guardian.rewards.deletePack")}
          variant="danger"
          icon="trash"
          disabled={busy}
          onPress={() => void run(() => remove({ packId: pack._id })).then((ok) => ok && onDone())}
        />
      ) : null}
    </Card>
  );
}

export function PacksSection({ packs }: { packs: Pack[] }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Id<"timePacks"> | "new" | null>(null);
  const current = editing && editing !== "new" ? packs.find((p) => p._id === editing) ?? null : null;

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.packGrid}>
        {packs.map((p) => (
          <Pressable
            key={p._id}
            accessibilityRole="button"
            accessibilityLabel={t("guardian.rewards.editPack", { time: formatMinutes(p.minutes) })}
            onPress={() => setEditing(p._id)}
            style={styles.packCell}
          >
            <Card
              highlight={editing === p._id ? T.timeFill : undefined}
              style={[styles.pack, !p.active && { opacity: 0.55 }]}
            >
              <Sprite name="hourglass" width={27} />
              <Num size={18} color={T.time}>
                {formatMinutes(p.minutes)}
              </Num>
              <Price coins={p.priceCoins} />
            </Card>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("guardian.rewards.newPack")}
          onPress={() => setEditing("new")}
          style={styles.packCell}
        >
          <View style={[styles.pack, styles.packAdd]}>
            <Icon name="plus" size={22} color={T.brassHi} />
            <Body size={13} weight="bold" color={T.brassHi} center>
              {t("guardian.rewards.newPack")}
            </Body>
          </View>
        </Pressable>
      </View>
      {editing ? <PackEditor key={editing} pack={current} onDone={() => setEditing(null)} /> : null}
    </View>
  );
}

// ─── Time rules ───────────────────────────────────────────────────────────

const MAX_DAILY = [30, 60, 90, 120, 150, 180, 240, 300];
const EXPIRY = [1, 3, 7, 14, 30];

function BedtimeSheet({ visible, settings, onClose }: { visible: boolean; settings: Settings; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useMutation(api.family.updateSettings);
  const [start, setStart] = useState(settings.bedtimeStart);
  const [end, setEnd] = useState(settings.bedtimeEnd);
  const { busy, error, setError, run } = useBusy();

  async function submit() {
    if (!isValidTime(start) || !isValidTime(end)) {
      setError(t("guardian.form.errors.time"));
      return;
    }
    const ok = await run(() => update({ bedtimeStart: start, bedtimeEnd: end }));
    if (ok) onClose();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={t("guardian.rewards.bedtime")}>
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Field label={t("guardian.rewards.bedtimeStart")} value={start} onChangeText={(v) => setStart(formatTimeInput(v))} keyboardType="number-pad" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("guardian.rewards.bedtimeEnd")} value={end} onChangeText={(v) => setEnd(formatTimeInput(v))} keyboardType="number-pad" maxLength={5} />
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
      <Button label={t("actions.save")} busy={busy} onPress={() => void submit()} />
    </Sheet>
  );
}

export function RulesSection({ settings }: { settings: Settings }) {
  const { t } = useTranslation();
  const update = useMutation(api.family.updateSettings);
  const [open, setOpen] = useState<"max" | "bed" | "expiry" | null>(null);
  const bedtime = `${settings.bedtimeStart}–${settings.bedtimeEnd}`;
  const expiry = t("guardian.rewards.expiryValue", { count: settings.timeExpiryDays });

  return (
    <Card style={{ paddingVertical: 0, paddingHorizontal: 14 }}>
      <SettingRow
        title={t("guardian.rewards.maxDaily")}
        desc={t("guardian.rewards.maxDailyDesc")}
        right={
          <ValueButton
            label={formatMinutes(settings.maxDailyScreenMin)}
            color={T.time}
            onPress={() => setOpen("max")}
            accessibilityLabel={t("guardian.notices.change", { what: t("guardian.rewards.maxDaily") })}
          />
        }
      />
      <SettingRow
        title={t("guardian.rewards.bedtime")}
        desc={t("guardian.rewards.bedtimeDesc")}
        right={
          <ValueButton
            label={bedtime}
            color={T.text}
            onPress={() => setOpen("bed")}
            accessibilityLabel={t("guardian.notices.change", { what: t("guardian.rewards.bedtime") })}
          />
        }
      />
      <SettingRow
        last
        title={t("guardian.rewards.expiry")}
        desc={t("guardian.rewards.expiryDesc")}
        right={
          <ValueButton
            label={expiry}
            color={T.text}
            onPress={() => setOpen("expiry")}
            accessibilityLabel={t("guardian.notices.change", { what: t("guardian.rewards.expiry") })}
          />
        }
      />
      <OptionSheet
        visible={open === "max"}
        title={t("guardian.rewards.maxDaily")}
        value={settings.maxDailyScreenMin}
        options={MAX_DAILY.map((m) => ({ value: m, label: formatMinutes(m) }))}
        onPick={(v) => void update({ maxDailyScreenMin: v })}
        onClose={() => setOpen(null)}
      />
      <OptionSheet
        visible={open === "expiry"}
        title={t("guardian.rewards.expiry")}
        value={settings.timeExpiryDays}
        options={EXPIRY.map((d) => ({ value: d, label: t("guardian.rewards.expiryValue", { count: d }) }))}
        onPick={(v) => void update({ timeExpiryDays: v })}
        onClose={() => setOpen(null)}
      />
      {open === "bed" ? <BedtimeSheet visible settings={settings} onClose={() => setOpen(null)} /> : null}
    </Card>
  );
}

// ─── Allowance ────────────────────────────────────────────────────────────

function parseReais(s: string): number | null {
  const n = Number(s.replace(/[^\d,.]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function RateSheet({ cents, onClose }: { cents: number; onClose: () => void }) {
  const { t } = useTranslation();
  const update = useMutation(api.family.updateSettings);
  const [value, setValue] = useState((cents / 100).toFixed(2).replace(".", ","));
  const { busy, error, setError, run } = useBusy();

  async function submit() {
    const next = parseReais(value);
    if (next === null) {
      setError(t("guardian.rewards.invalid"));
      return;
    }
    const ok = await run(() => update({ coinRateCents: next }));
    if (ok) onClose();
  }

  return (
    <Sheet visible onClose={onClose} title={t("guardian.rewards.allowanceTitle")}>
      <Field label={t("guardian.rewards.rateLabel")} value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={8} autoFocus />
      <ErrorText>{error}</ErrorText>
      <Button label={t("actions.save")} busy={busy} onPress={() => void submit()} />
    </Sheet>
  );
}

export function AllowanceSection({ settings, cofres }: { settings: Settings; cofres: Catalog["cofres"] }) {
  const { t } = useTranslation();
  const update = useMutation(api.family.updateSettings);
  const [editRate, setEditRate] = useState(false);
  const on = settings.allowanceEnabled;

  return (
    <Frame style={{ gap: 12 }}>
      <View style={styles.rowCenter}>
        <Sprite name="chestOpen" width={50} />
        <View style={{ flex: 1, gap: 2 }}>
          <Body size={16} weight="bold">
            {t("guardian.rewards.allowanceTitle")}
          </Body>
          <Body size={13} color={T.muted}>
            {t("guardian.rewards.allowanceDesc")}
          </Body>
        </View>
        <Toggle value={on} onChange={(v) => void update({ allowanceEnabled: v })} label={t("guardian.rewards.allowanceTitle")} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("guardian.rewards.rateEdit")}
        onPress={() => setEditRate(true)}
        style={!on && { opacity: 0.55 }}
      >
        <Card style={styles.rate}>
          <View style={styles.rowCenter}>
            <Sprite name="coin" width={18} />
            <Num size={17} color={T.coin}>
              {t("guardian.rewards.rate")}
            </Num>
          </View>
          <Body color={T.faint}>=</Body>
          <Num size={17} color={T.coin}>
            {brl(settings.coinRateCents)}
          </Num>
          <Icon name="quill" size={16} color={T.muted} />
        </Card>
      </Pressable>
      {cofres.map((c) => (
        <View key={c._id} style={styles.cofre}>
          <Body size={14} color={T.muted}>
            {t("guardian.rewards.cofreOf", { name: c.name })}
          </Body>
          <Num size={15}>{brl(c.cofreCents)}</Num>
        </View>
      ))}
      {editRate ? <RateSheet cents={settings.coinRateCents} onClose={() => setEditRate(false)} /> : null}
    </Frame>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 12 },
  pair: { flexDirection: "row", gap: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  packGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  packCell: { flexBasis: "30%", flexGrow: 1, maxWidth: "33%" },
  pack: { alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 6, minHeight: 112, justifyContent: "center" },
  packAdd: { borderWidth: 1, borderStyle: "dashed", borderColor: T.brassDk, borderRadius: 6 },
  rate: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 12 },
  cofre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
