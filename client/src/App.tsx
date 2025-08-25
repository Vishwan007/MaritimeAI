import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/chat";
import { useEffect } from "react";
import type { Conversation } from "@shared/schema";
import KnowledgeBase from "@/pages/knowledge-base";
import VoyageTools from "@/pages/voyage-tools";
import SigninPage from "@/pages/signin";
import SignupPage from "@/pages/signup";


function Router() {
  const [location, setLocation] = useLocation();

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<Conversation>("/api/conversations", {
        method: "POST",
        data: { title: "New Conversation" }
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/chat/${newConversation.id}`);
    }
  });

  useEffect(() => {
    if (location === "/") {
      createConversationMutation.mutate();
    }
  }, [location, createConversationMutation]);

  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/chat/:conversationId?" component={Chat} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/voyage-tools" component={VoyageTools} />
      <Route path="/signin" component={SigninPage} />
      <Route path="/signup" component={SignupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;