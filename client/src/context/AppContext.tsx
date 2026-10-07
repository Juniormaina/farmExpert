import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Channel, CropId, DemoProfile, Locale, SystemStatus } from "../types";
import { getDemoProfile, getStatus, resetDemo as apiResetDemo, syncPendingMessages } from "../api/client";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { LOCAL_DEMO_PROFILE } from "../offline/localData";
import { clearFarmProfile, loadFarmProfile, saveFarmProfile, type FarmProfile } from "../profile";

export type StatusLabel =
  | "online-hosted"
  | "offline-local-ai"
  | "offline-deterministic"
  | "offline-cached"
  | "waiting-for-connectivity";

interface AppContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  channel: Channel;
  setChannel: (channel: Channel) => void;
  demoProfile: DemoProfile;
  status: SystemStatus | undefined;
  statusSource: "live" | "cache" | "bundled";
  statusLabel: StatusLabel;
  browserOnline: boolean;
  refreshStatus: () => Promise<void>;
  resetDemo: () => Promise<void>;
  startDemo: () => void;
  demoResetKey: number;
  demoQueryTrigger: number;
  county: string;
  setCounty: (county: string) => void;
  crop: CropId;
  setCrop: (crop: CropId) => void;
  profileRevision: number;
  applyFarmProfile: (profile: FarmProfile) => void;
  clearSavedFarm: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [channel, setChannel] = useState<Channel>("web");
  const [demoProfile, setDemoProfile] = useState<DemoProfile>(LOCAL_DEMO_PROFILE);
  const [status, setStatus] = useState<SystemStatus | undefined>(undefined);
  const [statusSource, setStatusSource] = useState<"live" | "cache" | "bundled">("bundled");
  const [demoResetKey, setDemoResetKey] = useState(0);
  const [demoQueryTrigger, setDemoQueryTrigger] = useState(0);
  const [county, setCounty] = useState(LOCAL_DEMO_PROFILE.county);
  const [crop, setCrop] = useState<CropId>(LOCAL_DEMO_PROFILE.crop);
  const [profileRevision, setProfileRevision] = useState(0);
  const browserOnline = useOnlineStatus();

  const refreshStatus = useCallback(async () => {
    const result = await getStatus();
    setStatus(result.data);
    setStatusSource(result.source);
  }, []);

  useEffect(() => {
    const saved = loadFarmProfile();
    if (saved) {
      setLocale(saved.locale);
      setCounty(saved.county);
      setCrop(saved.crop);
    }
  }, []);

  useEffect(() => {
    getDemoProfile().then(setDemoProfile);
    refreshStatus();
    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  useEffect(() => {
    if (browserOnline) {
      syncPendingMessages().then((count) => {
        if (count > 0) refreshStatus();
      });
      refreshStatus();
    }
  }, [browserOnline, refreshStatus]);

  const resetDemo = useCallback(async () => {
    await apiResetDemo();
    setChannel("web");
    setCounty(demoProfile.county);
    setCrop(demoProfile.crop);
    setDemoResetKey((k) => k + 1);
    await refreshStatus();
  }, [refreshStatus, demoProfile.county, demoProfile.crop]);

  const startDemo = useCallback(() => {
    setChannel("web");
    setDemoQueryTrigger((k) => k + 1);
  }, []);

  const applyFarmProfile = useCallback((profile: FarmProfile) => {
    saveFarmProfile(profile);
    setLocale(profile.locale);
    setCounty(profile.county);
    setCrop(profile.crop);
    setProfileRevision((n) => n + 1);
  }, []);

  const clearSavedFarm = useCallback(() => {
    clearFarmProfile();
    setCounty(LOCAL_DEMO_PROFILE.county);
    setCrop(LOCAL_DEMO_PROFILE.crop);
    setProfileRevision((n) => n + 1);
  }, []);

  const statusLabel: StatusLabel = useMemo(() => {
    if (statusSource === "bundled" && !status?.providers.length) return "waiting-for-connectivity";
    if (statusSource === "cache") return "offline-cached";
    if (!browserOnline) return status?.activeProvider === "ollama" ? "offline-local-ai" : "offline-deterministic";
    if (status?.activeProvider === "hosted") return "online-hosted";
    if (status?.activeProvider === "ollama") return "offline-local-ai";
    return "offline-deterministic";
  }, [status, statusSource, browserOnline]);

  const value: AppContextValue = {
    locale,
    setLocale,
    channel,
    setChannel,
    demoProfile,
    status,
    statusSource,
    statusLabel,
    browserOnline,
    refreshStatus,
    resetDemo,
    startDemo,
    demoResetKey,
    demoQueryTrigger,
    county,
    setCounty,
    crop,
    setCrop,
    profileRevision,
    applyFarmProfile,
    clearSavedFarm
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
