import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion } from '../appVersion.api';
import { loadPref, savePref } from '../../services/prefs';
import { CURRENT_VERSION_CODE } from '../../config/appVersion';

const DISMISSED_KEY = 'dismissedUpdateVersion';

export function useAppVersion() {
  return useQuery({
    queryKey: ['app-version'] as const,
    queryFn: fetchAppVersion,
    staleTime: 30 * 60_000,
    retry: 0,
  });
}

/**
 * Whether a newer version is available, and dismiss state for the floating
 * banner. Dismissal is remembered per version code (in prefs, via Keychain) so
 * closing it doesn't hide it forever — once an even newer version ships, the
 * floating banner comes back.
 */
export function useUpdateAvailable() {
  const { data } = useAppVersion();
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPref(DISMISSED_KEY).then((raw) => {
      if (cancelled) return;
      setDismissedVersion(raw ? Number(raw) : null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const available = !!data && data.latestVersionCode > CURRENT_VERSION_CODE;
  const dismissed = loaded && dismissedVersion === data?.latestVersionCode;

  const dismiss = () => {
    if (!data) return;
    setDismissedVersion(data.latestVersionCode);
    void savePref(DISMISSED_KEY, String(data.latestVersionCode));
  };

  return { data, available, dismissed: available && dismissed, dismiss };
}
