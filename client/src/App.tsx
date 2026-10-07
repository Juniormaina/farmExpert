import { useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Header } from "./components/Header";
import { ChannelSwitcher } from "./components/ChannelSwitcher";
import { DemoProfileCard } from "./components/DemoProfileCard";
import { ChatPanel } from "./components/ChatPanel";
import { MarketCards } from "./components/MarketCards";
import { FertilizerCards } from "./components/FertilizerCards";
import { BudgetCalculatorPanel } from "./components/BudgetCalculatorPanel";
import { PriceFilters } from "./components/PriceFilters";
import { SmsSimulator } from "./components/SmsSimulator";
import { UssdSimulator } from "./components/UssdSimulator";
import { TaskCards } from "./components/TaskCards";
import { InstallPrompt } from "./components/InstallPrompt";
import { Onboarding } from "./components/Onboarding";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { UI_STRINGS } from "./i18n";

function Dashboard() {
  const { channel, demoResetKey, locale, profileRevision } = useAppContext();
  const t = UI_STRINGS[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "sw" ? "sw" : "en";
  }, [locale]);

  // On wide screens the data column sits beside every channel, so SMS and USSD
  // show the same prices the phone is answering with. On phones it only
  // appears under the Web tab, keeping the simulators uncluttered.
  const dataColumnClass = channel === "web" ? "layout-data" : "layout-data desktop-only";

  return (
    <>
      <a className="skip-link" href="#content">
        {t.skipToContent}
      </a>
      <Header />
      <main id="content" className="app-shell">
        {channel === "web" && <TaskCards />}
        <ChannelSwitcher />
        {channel === "web" && <Onboarding />}
        {channel === "web" && <InstallPrompt />}
        <UpdatePrompt />
        <div className="layout">
          <div className="layout-channel">
            <DemoProfileCard key={`profile-${demoResetKey}`} />
            {channel === "web" && <ChatPanel />}
            {channel === "sms" && <SmsSimulator key={`sms-${demoResetKey}`} />}
            {channel === "ussd" && <UssdSimulator key={`ussd-${demoResetKey}`} />}
          </div>
          <div className={dataColumnClass}>
            <PriceFilters />
            <MarketCards />
            <FertilizerCards />
          </div>
        </div>
        <div className={channel === "web" ? "layout-wide" : "layout-wide desktop-only"}>
          <BudgetCalculatorPanel key={`budget-${demoResetKey}-${profileRevision}`} />
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
