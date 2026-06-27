import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Research from "@/pages/dashboards/Research";
import FactorExplorer from "@/pages/dashboards/FactorExplorer";
import Portfolio from "@/pages/dashboards/Portfolio";
import Monitoring from "@/pages/dashboards/Monitoring";
import Registry from "@/pages/dashboards/Registry";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={() => <Redirect to="/research" />} />
              <Route path="/research" component={Research} />
              <Route path="/factors" component={FactorExplorer} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/monitoring" component={Monitoring} />
              <Route path="/registry" component={Registry} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;