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

function Dashboard() {
  const { channel, demoResetKey } = useAppContext();

  // On wide screens the data column sits beside every channel, so SMS and USSD
  // show the same prices the phone is answering with. On phones it only
  // appears under the Web tab, keeping the simulators uncluttered.
  const dataColumnClass = channel === "web" ? "layout-data" : "layout-data desktop-only";

  return (
    <>
      <Header />
      <main className="app-shell">
        <ChannelSwitcher />
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
          <BudgetCalculatorPanel key={`budget-${demoResetKey}`} />
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
