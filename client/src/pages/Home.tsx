import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import GeneratorTab from "@/pages/GeneratorTab";
import ImproverTab from "@/pages/ImproverTab";
import LibraryTab from "@/pages/LibraryTab";
import HistoryTab from "@/pages/HistoryTab";
import CustomTabsTab from "@/pages/CustomTabsTab";
import { useCustomTabs } from "@/hooks/useCustomTabs";
import { SessionManager } from "@/components/SessionManager";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTabState] = useSessionStorage("home_active_tab", "generator");
  const { tabs: customTabs } = useCustomTabs();

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-slate-900">Prompt Engineer Pro</h1>
            <p className="text-xl text-slate-600">
              Craft, analyze, and perfect your AI prompts with elegant precision
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <Sparkles className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Generate</h3>
              <p className="text-sm text-slate-600">Convert ideas into optimized prompts</p>
            </Card>
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <BookOpen className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Improve</h3>
              <p className="text-sm text-slate-600">Enhance existing prompts with insights</p>
            </Card>
            <Card className="p-6 border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <ArrowRight className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Organize</h3>
              <p className="text-sm text-slate-600">Build your personal prompt library</p>
            </Card>
          </div>

          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              Prompt Engineer Pro
            </h1>
            <SessionManager />
          </div>
          <p className="text-slate-600">Welcome back, {user?.name}. Craft perfect prompts with AI assistance.</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation - Properly wrapped in TabsList */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Core Tabs */}
            <TabsList className="bg-white border border-slate-200 shadow-sm flex-shrink-0 h-auto gap-1 p-1">
              <TabsTrigger
                value="generator"
                className="rounded data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap text-sm font-medium"
              >
                Generate
              </TabsTrigger>
              <TabsTrigger
                value="improver"
                className="rounded data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap text-sm font-medium"
              >
                Improve
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap text-sm font-medium"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="rounded data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap text-sm font-medium"
              >
                Library
              </TabsTrigger>
              <TabsTrigger
                value="custom-tabs"
                className="rounded data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap text-sm font-medium"
              >
                Custom Tabs
              </TabsTrigger>
            </TabsList>

            {/* Custom Tabs */}
            {customTabs.length > 0 && (
              <TabsList className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm flex-shrink-0 h-auto gap-1 p-1">
                {customTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={`custom-${tab.id}`}
                    className="rounded data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white whitespace-nowrap text-xs font-medium px-3 py-1"
                    title={tab.description || tab.name}
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
          </div>

          {/* Tab Contents - Core Tabs */}
          <TabsContent value="generator" className="space-y-6">
            <GeneratorTab />
          </TabsContent>

          <TabsContent value="improver" className="space-y-6">
            <ImproverTab />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <LibraryTab />
          </TabsContent>

          <TabsContent value="custom-tabs" className="space-y-6">
            <CustomTabsTab />
          </TabsContent>

          {/* Dynamic Custom Tab Contents */}
          {customTabs.map((tab) => (
            <TabsContent key={tab.id} value={`custom-${tab.id}`} className="space-y-6">
              <Card className="p-6 border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <h2 className="text-2xl font-bold text-slate-900">{tab.name}</h2>
                  </div>
                  {tab.description && (
                    <p className="text-slate-600 text-sm">{tab.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm pt-2">
                    <span className="inline-block px-3 py-1 bg-purple-200 text-purple-800 rounded-full font-semibold text-xs">
                      {tab.framework}
                    </span>
                    {tab.temperature !== undefined && (
                      <span className="text-slate-600">
                        Temperature: <span className="font-semibold">{tab.temperature}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
              <GeneratorTab
                defaultFramework={tab.framework}
                customSystemPrompt={tab.systemPrompt}
                stateKey={`generator_state_${tab.id}`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
