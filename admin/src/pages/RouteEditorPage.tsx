import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import { MapEditor, EditMode } from '../components/MapEditor';
import { fetchRoute, createRoute, replaceRoute } from '../api/routes';
import { snapToRoads } from '../lib/directions';
import { apiErrorMessage } from '../api/client';
import {
  AdminCheckpoint,
  AdminTip,
  CATEGORIES,
  CHECKPOINT_TYPES,
  DIFFICULTIES,
  emptyLocalizedText,
  GeoPoint,
  Locale,
  LOCALE_LABELS,
  LOCALES,
  LocalizedText,
  PathPoint,
  pickLocalizedText,
  RouteCategory,
  Difficulty,
  TIP_TYPES,
} from '../types';

export function RouteEditorPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: () => fetchRoute(id!),
    enabled: isEdit,
  });

  // ── form state ──────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Locale>('ru');
  const [title, setTitle] = useState<LocalizedText>(emptyLocalizedText());
  const [description, setDescription] = useState<LocalizedText>(emptyLocalizedText());
  const [category, setCategory] = useState<RouteCategory>('SCENIC');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [region, setRegion] = useState<LocalizedText>({
    ...emptyLocalizedText(),
    ru: 'Павлодар, Казахстан',
  });
  const [country, setCountry] = useState<LocalizedText>({
    ...emptyLocalizedText(),
    ru: 'Казахстан',
  });
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [waypoints, setWaypoints] = useState<PathPoint[]>([]);
  const [geometry, setGeometry] = useState<GeoPoint[] | null>(null);
  const [checkpoints, setCheckpoints] = useState<AdminCheckpoint[]>([]);
  const [tips, setTips] = useState<AdminTip[]>([]);

  const [mode, setMode] = useState<EditMode>('waypoint');
  const [selectedCp, setSelectedCp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Populate from server when editing.
  useEffect(() => {
    if (!existing || hydrated) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setCategory(existing.category);
    setDifficulty(existing.difficulty);
    setRegion(existing.region);
    setCountry(existing.country);
    setCoverImageUrl(existing.coverImageUrl ?? '');
    setDistanceKm(existing.distanceKm);
    setEstimatedMinutes(existing.estimatedMinutes);
    setWaypoints(
      [...existing.pathPoints].sort((a, b) => a.sequence - b.sequence),
    );
    setGeometry(existing.routeGeometry);
    setCheckpoints(
      [...existing.checkpoints]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((c) => ({
          name: c.name,
          type: c.type,
          lat: c.lat,
          lng: c.lng,
          altitudeM: c.altitudeM,
          radiusTriggerM: c.radiusTriggerM,
          description: c.description,
          qrCode: c.qrCode ?? undefined,
          orderIndex: c.orderIndex,
        })),
    );
    setTips(
      existing.tips.map((t) => ({
        type: t.type,
        text: t.text,
        checkpointIndex: t.checkpointId
          ? existing.checkpoints
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .findIndex((c) => c.id === t.checkpointId)
          : null,
      })),
    );
    setHydrated(true);
  }, [existing, hydrated]);

  // ── waypoint handlers ───────────────────────────────────────────────────
  const addWaypoint = (lng: number, lat: number) =>
    setWaypoints((w) => [...w, { lat, lng, sequence: w.length }]);
  const moveWaypoint = (i: number, lng: number, lat: number) =>
    setWaypoints((w) => w.map((p, idx) => (idx === i ? { ...p, lat, lng } : p)));
  const removeLastWaypoint = () =>
    setWaypoints((w) => w.slice(0, -1).map((p, idx) => ({ ...p, sequence: idx })));
  const removeWaypoint = (i: number) =>
    setWaypoints((w) =>
      w.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, sequence: idx })),
    );
  const clearWaypoints = () => {
    setWaypoints([]);
    setGeometry(null);
  };

  // ── checkpoint handlers ─────────────────────────────────────────────────
  const addCheckpoint = (lng: number, lat: number) => {
    setCheckpoints((c) => [
      ...c,
      {
        name: { ...emptyLocalizedText(), ru: `Чекпоинт ${c.length + 1}` },
        type: 'INFO',
        lat,
        lng,
        radiusTriggerM: 30,
        description: emptyLocalizedText(),
        orderIndex: c.length,
      },
    ]);
    setSelectedCp(checkpoints.length);
  };
  const moveCheckpoint = (i: number, lng: number, lat: number) =>
    setCheckpoints((c) => c.map((p, idx) => (idx === i ? { ...p, lat, lng } : p)));
  const patchCheckpoint = (i: number, patch: Partial<AdminCheckpoint>) =>
    setCheckpoints((c) => c.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removeCheckpoint = (i: number) =>
    setCheckpoints((c) =>
      c.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, orderIndex: idx })),
    );

  // ── tips ────────────────────────────────────────────────────────────────
  const addTip = () =>
    setTips((t) => [
      ...t,
      { type: 'ADVICE', text: emptyLocalizedText(), checkpointIndex: null },
    ]);
  const patchTip = (i: number, patch: Partial<AdminTip>) =>
    setTips((t) => t.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removeTip = (i: number) =>
    setTips((t) => t.filter((_, idx) => idx !== i));

  // ── snap to roads ─────────────────────────────────────────────────────────
  const onSnap = async () => {
    if (waypoints.length < 2) {
      setError('Add at least 2 waypoints before snapping.');
      return;
    }
    setSnapping(true);
    setError(null);
    try {
      const snapped = await snapToRoads(waypoints);
      setGeometry(snapped.geometry);
      setDistanceKm(snapped.distanceKm);
      setEstimatedMinutes(snapped.durationMin);
    } finally {
      setSnapping(false);
    }
  };

  const onSave = async () => {
    setError(null);
    if (title.ru.trim().length < 3)
      return setError('Title (RU) must be at least 3 characters.');
    if (!description.ru.trim()) return setError('Description (RU) is required.');
    if (waypoints.length < 2) return setError('A route needs at least 2 waypoints.');
    if (!country.ru.trim() || !region.ru.trim())
      return setError('Country and region (RU) are required.');
    for (const cp of checkpoints) {
      if (!cp.name.ru.trim() || !cp.description.ru.trim())
        return setError('Every checkpoint needs a name and description (RU).');
    }

    setSaving(true);
    try {
      // Ensure we have a road-snapped geometry; compute if missing.
      let geo = geometry;
      let dist = distanceKm;
      let mins = estimatedMinutes;
      if (!geo || geo.length < 2) {
        const snapped = await snapToRoads(waypoints);
        geo = snapped.geometry;
        if (!dist) dist = snapped.distanceKm;
        if (!mins) mins = snapped.durationMin;
      }
      const trimAll = (text: LocalizedText): LocalizedText => ({
        ru: text.ru.trim(),
        en: text.en.trim(),
        kk: text.kk.trim(),
      });
      const payload = {
        title: trimAll(title),
        description: trimAll(description),
        category,
        difficulty,
        region: trimAll(region),
        country: trimAll(country),
        coverImageUrl: coverImageUrl.trim() || null,
        distanceKm: dist || 0.1,
        estimatedMinutes: mins || 1,
        pathPoints: waypoints.map((w, i) => ({ ...w, sequence: i })),
        routeGeometry: geo,
        checkpoints: checkpoints.map((c, i) => ({ ...c, orderIndex: i })),
        tips,
      };
      if (isEdit) await replaceRoute(id!, payload);
      else await createRoute(payload);
      // Drop this route's cached query entirely (not just invalidate) so the
      // next time its editor is opened it always fetches fresh — invalidating
      // alone still serves the stale cached value on first render while the
      // background refetch is in flight, which the one-time hydration effect
      // above would lock onto and never reconcile.
      if (isEdit) qc.removeQueries({ queryKey: ['route', id] });
      qc.invalidateQueries({ queryKey: ['routes'] });
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the route.'));
    } finally {
      setSaving(false);
    }
  };

  const modeHint = useMemo(() => {
    if (mode === 'waypoint')
      return 'Click the map to add route waypoints (drag to adjust). Then “Snap to roads”.';
    if (mode === 'checkpoint')
      return 'Click the map to drop a checkpoint. Click a checkpoint marker to edit it below.';
    return 'Viewing only — pick a tool to edit.';
  }, [mode]);

  if (isEdit && isLoading) return <div className="spinner">Loading route…</div>;

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{isEdit ? 'Edit route' : 'New route'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save route'}
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="toolbar">
        <span className="muted">Editing language:</span>
        {LOCALES.map((l) => (
          <button
            key={l}
            className={lang === l ? '' : 'secondary'}
            onClick={() => setLang(l)}
          >
            {LOCALE_LABELS[l]}
            {l !== 'ru' && !title[l] && !description[l] && !region[l] && !country[l]
              ? ' ○'
              : ''}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="row">
          <div className="field">
            <label>Title ({LOCALE_LABELS[lang]})</label>
            <input
              value={title[lang]}
              onChange={(e) => setTitle((p) => ({ ...p, [lang]: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Cover image URL (optional)</label>
            <input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="field">
          <label>Description ({LOCALE_LABELS[lang]})</label>
          <textarea
            value={description[lang]}
            onChange={(e) =>
              setDescription((p) => ({ ...p, [lang]: e.target.value }))
            }
          />
        </div>
        <div className="row">
          <div className="field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RouteCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Country ({LOCALE_LABELS[lang]})</label>
            <input
              value={country[lang]}
              onChange={(e) => setCountry((p) => ({ ...p, [lang]: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Region ({LOCALE_LABELS[lang]})</label>
            <input
              value={region[lang]}
              onChange={(e) => setRegion((p) => ({ ...p, [lang]: e.target.value }))}
            />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Distance (km)</label>
            <input
              type="number"
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Est. minutes</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Route map</h3>
        <div className="toolbar">
          <button
            className={mode === 'waypoint' ? '' : 'secondary'}
            onClick={() => setMode('waypoint')}
          >
            ➕ Waypoint
          </button>
          <button
            className={mode === 'checkpoint' ? '' : 'secondary'}
            onClick={() => setMode('checkpoint')}
          >
            📍 Checkpoint
          </button>
          <button className="secondary" onClick={onSnap} disabled={snapping}>
            {snapping ? 'Snapping…' : '🛣 Snap to roads'}
          </button>
          <button className="ghost" onClick={removeLastWaypoint}>
            Undo waypoint
          </button>
          <button className="ghost" onClick={clearWaypoints}>
            Clear waypoints
          </button>
          <span className="muted">
            {waypoints.length} waypoints · {checkpoints.length} checkpoints ·{' '}
            {geometry ? `${geometry.length}-pt snapped line` : 'not snapped'}
          </span>
        </div>
        <div className="mode-hint">
          {modeHint} Right-click a marker on the map to delete it.
        </div>
        <MapEditor
          waypoints={waypoints}
          checkpoints={checkpoints}
          geometry={geometry}
          mode={mode}
          selectedCheckpoint={selectedCp}
          onAddWaypoint={addWaypoint}
          onMoveWaypoint={moveWaypoint}
          onRemoveWaypoint={removeWaypoint}
          onAddCheckpoint={addCheckpoint}
          onMoveCheckpoint={moveCheckpoint}
          onRemoveCheckpoint={removeCheckpoint}
          onSelectCheckpoint={setSelectedCp}
        />
      </div>

      <div className="card">
        <h3>Checkpoints ({checkpoints.length})</h3>
        {checkpoints.length === 0 ? (
          <div className="muted">
            Switch to the Checkpoint tool and click the map to add checkpoints.
          </div>
        ) : null}
        {checkpoints.map((cp, i) => (
          <div
            className="cp-item"
            key={i}
            style={
              selectedCp === i ? { borderColor: 'var(--clay)' } : undefined
            }
            onClick={() => setSelectedCp(i)}
          >
            <div className="head">
              <strong>#{i + 1}</strong>
              <button className="danger" onClick={() => removeCheckpoint(i)}>
                Remove
              </button>
            </div>
            <div className="row">
              <div className="field">
                <label>Name ({LOCALE_LABELS[lang]})</label>
                <input
                  value={cp.name[lang]}
                  onChange={(e) =>
                    patchCheckpoint(i, { name: { ...cp.name, [lang]: e.target.value } })
                  }
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={cp.type}
                  onChange={(e) =>
                    patchCheckpoint(i, { type: e.target.value as AdminCheckpoint['type'] })
                  }
                >
                  {CHECKPOINT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Trigger radius (m)</label>
                <input
                  type="number"
                  value={cp.radiusTriggerM}
                  onChange={(e) =>
                    patchCheckpoint(i, { radiusTriggerM: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Description ({LOCALE_LABELS[lang]})</label>
              <textarea
                value={cp.description[lang]}
                onChange={(e) =>
                  patchCheckpoint(i, {
                    description: { ...cp.description, [lang]: e.target.value },
                  })
                }
              />
            </div>
            <div className="muted">
              {cp.lat.toFixed(5)}, {cp.lng.toFixed(5)} — drag its map marker to move
            </div>
            <CheckpointQr
              code={cp.qrCode ?? null}
              label={`#${i + 1} ${pickLocalizedText(cp.name)}`}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Tips ({tips.length})</h3>
          <button className="secondary" onClick={addTip}>
            + Add tip
          </button>
        </div>
        {tips.map((tip, i) => (
          <div className="cp-item" key={i}>
            <div className="row">
              <div className="field">
                <label>Type</label>
                <select
                  value={tip.type}
                  onChange={(e) =>
                    patchTip(i, { type: e.target.value as AdminTip['type'] })
                  }
                >
                  {TIP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Applies to</label>
                <select
                  value={tip.checkpointIndex ?? ''}
                  onChange={(e) =>
                    patchTip(i, {
                      checkpointIndex:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="">Whole route</option>
                  {checkpoints.map((cp, idx) => (
                    <option key={idx} value={idx}>
                      #{idx + 1} {pickLocalizedText(cp.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '0 0 auto', alignSelf: 'end' }}>
                <button className="danger" onClick={() => removeTip(i)}>
                  Remove
                </button>
              </div>
            </div>
            <div className="field">
              <label>Text ({LOCALE_LABELS[lang]})</label>
              <textarea
                value={tip.text[lang]}
                onChange={(e) =>
                  patchTip(i, { text: { ...tip.text, [lang]: e.target.value } })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Renders the printable QR for a saved checkpoint, with its label + code and a
 *  PNG download. New (unsaved) checkpoints have no code yet — show a hint. */
function CheckpointQr({
  code,
  label,
}: {
  code: string | null;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  if (!code) {
    return (
      <div className="qr-block">
        <div className="muted">
          💡 Save the route to generate this checkpoint's QR code.
        </div>
      </div>
    );
  }

  const download = () => {
    const canvas = ref.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${label}-qr.png`.replace(/[^\w.-]+/g, '_');
    a.click();
  };

  return (
    <div className="qr-block">
      <QRCodeCanvas ref={ref} value={code} size={148} level="M" marginSize={2} />
      <div className="qr-meta">
        <div className="qr-label">{label}</div>
        <code className="qr-code">{code}</code>
        <button type="button" className="secondary" onClick={download}>
          ⬇ Download PNG
        </button>
      </div>
    </div>
  );
}
