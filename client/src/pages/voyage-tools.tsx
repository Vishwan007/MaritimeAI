import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Sun, 
  Clock, 
  MapPin, 
  FileText, 
  Calculator,
  Compass,
  Anchor,
  Ship,
  TrendingUp,
  Calendar,
  Wind,
  Route
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function VoyageTools() {
  const { toast } = useToast();
  
  // Weather Tool State
  const [weatherLocation, setWeatherLocation] = useState("");
  const [weatherResult, setWeatherResult] = useState(null);
  
  // Laytime Calculator State  
  const [arrivalTime, setArrivalTime] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [laytimeResult, setLaytimeResult] = useState(null);
  
  // Distance Calculator State
  const [fromPort, setFromPort] = useState("");
  const [toPort, setToPort] = useState("");
  const [distanceResult, setDistanceResult] = useState(null);
  
  // CP Clause Analyzer State
  const [clauseText, setClauseText] = useState("");
  const [clauseResult, setClauseResult] = useState(null);

  // Fetch knowledge base for context
  const { data: knowledgeEntries } = useQuery({
    queryKey: ["/api/knowledge-base"],
  });

  const handleWeatherSearch = async () => {
    if (!weatherLocation.trim()) {
      toast({ title: "Error", description: "Please enter a location.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/maritime/weather?location=${encodeURIComponent(weatherLocation)}`);
      const data = await response.json();
      
      if (response.ok) {
        setWeatherResult(data);
        toast({
          title: `Weather Retrieved`,
          description: `Weather data for ${weatherLocation} has been loaded.`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch weather data.", variant: "destructive" });
    }
  };

  const handleLaytimeCalculation = async () => {
    if (!arrivalTime || !completionTime) {
      toast({ title: "Error", description: "Please enter both arrival and completion times.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/maritime/laytime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrivalTime,
          completionTime,
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setLaytimeResult(data);
        toast({
          title: "Laytime Calculated",
          description: `Total: ${data.totalHours} hours (${data.totalDays} days)`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to calculate laytime.", variant: "destructive" });
    }
  };

  const handleDistanceCalculation = async () => {
    if (!fromPort.trim() || !toPort.trim()) {
      toast({ title: "Error", description: "Please enter both ports.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/maritime/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPort,
          toPort,
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDistanceResult(data);
        toast({
          title: "Distance Calculated",
          description: `${data.distanceNM} NM, Est. ${data.estimatedDays} days`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to calculate distance.", variant: "destructive" });
    }
  };

  const handleClauseAnalysis = async () => {
    if (!clauseText.trim()) {
      toast({ title: "Error", description: "Please enter clause text.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/maritime/cp-clause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseText })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setClauseResult(data);
        toast({
          title: "Clause Analyzed",
          description: `${data.clauseType}: Analysis complete`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze clause.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-maritime-blue rounded-lg flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Voyage Tools</h1>
              <p className="text-muted-foreground">Professional maritime calculation and analysis tools</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weather Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wind className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold">50+</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Port Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Anchor className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">1000+</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold">{knowledgeEntries?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calculator className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tools */}
        <Tabs defaultValue="weather" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weather" className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Weather</span>
            </TabsTrigger>
            <TabsTrigger value="laytime" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Laytime</span>
            </TabsTrigger>
            <TabsTrigger value="distance" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Distance</span>
            </TabsTrigger>
            <TabsTrigger value="clauses" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>CP Clauses</span>
            </TabsTrigger>
          </TabsList>

          {/* Weather Tool */}
          <TabsContent value="weather">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span>Weather Conditions</span>
                  </CardTitle>
                  <CardDescription>
                    Get current weather conditions and maritime operational guidance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="weather-location">Location (Port or City)</Label>
                    <Input
                      id="weather-location"
                      placeholder="e.g., Hamburg, Rotterdam, Singapore"
                      value={weatherLocation}
                      onChange={(e) => setWeatherLocation(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleWeatherSearch()}
                    />
                  </div>
                  <Button onClick={handleWeatherSearch} className="w-full">
                    <Wind className="w-4 h-4 mr-2" />
                    Get Weather Conditions
                  </Button>
                </CardContent>
              </Card>

              {weatherResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Weather Report - {weatherLocation}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Condition:</span>
                        <span>{weatherResult.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Temperature:</span>
                        <span>{weatherResult.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Wind Speed:</span>
                        <span>{weatherResult.windSpeed} knots</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Visibility:</span>
                        <span>{weatherResult.visibility} NM</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground font-medium">Maritime Operations:</p>
                        <p className="text-sm mt-1">{weatherResult.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Laytime Calculator */}
          <TabsContent value="laytime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span>Laytime Calculator</span>
                  </CardTitle>
                  <CardDescription>
                    Calculate laytime for loading/discharge operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="arrival-time">Arrival Time (NOR Tendered)</Label>
                    <Input
                      id="arrival-time"
                      type="datetime-local"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="completion-time">Completion Time</Label>
                    <Input
                      id="completion-time"
                      type="datetime-local"
                      value={completionTime}
                      onChange={(e) => setCompletionTime(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleLaytimeCalculation} className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Laytime
                  </Button>
                </CardContent>
              </Card>

              {laytimeResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Laytime Calculation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Hours:</span>
                        <span className="text-lg font-bold text-blue-600">{laytimeResult.totalHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Days:</span>
                        <span className="text-lg font-bold text-blue-600">{laytimeResult.totalDays}</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground font-medium">Industry Notes:</p>
                        <ul className="text-sm mt-1 space-y-1 text-muted-foreground">
                          <li>• Excludes weather delays (WWD basis)</li>
                          <li>• Demurrage applies if exceeding CP terms</li>
                          <li>• Document all delays with proper notices</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Distance Calculator */}
          <TabsContent value="distance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    <span>Distance Calculator</span>
                  </CardTitle>
                  <CardDescription>
                    Calculate distances between ports and estimate voyage time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="from-port">From Port</Label>
                    <Input
                      id="from-port"
                      placeholder="e.g., Singapore, Hamburg, Rotterdam"
                      value={fromPort}
                      onChange={(e) => setFromPort(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-port">To Port</Label>
                    <Input
                      id="to-port"
                      placeholder="e.g., Dubai, Shanghai, New York"
                      value={toPort}
                      onChange={(e) => setToPort(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleDistanceCalculation} className="w-full">
                    <Route className="w-4 h-4 mr-2" />
                    Calculate Distance
                  </Button>
                </CardContent>
              </Card>

              {distanceResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distance Calculation: {distanceResult.fromPort} ↔ {distanceResult.toPort}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Distance:</span>
                        <span className="text-lg font-bold text-purple-600">{distanceResult.distanceNM} NM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Transit Time:</span>
                        <span>{distanceResult.estimatedDays} days (14 kts avg)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Fuel Consumption:</span>
                        <span>{distanceResult.fuelConsumption} MT</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground font-medium">Voyage Planning:</p>
                        <ul className="text-sm mt-1 space-y-1 text-muted-foreground">
                          <li>• Great circle distance calculation</li>
                          <li>• Add 10-15% for weather routing</li>
                          <li>• Consider seasonal patterns</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* CP Clauses */}
          <TabsContent value="clauses">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span>Charter Party Clause Analyzer</span>
                  </CardTitle>
                  <CardDescription>
                    Analyze and interpret maritime contract clauses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clause-text">Charter Party Clause</Label>
                    <textarea
                      id="clause-text"
                      className="w-full p-3 border border-border rounded-md resize-none min-h-[120px] bg-background text-foreground"
                      placeholder="Paste charter party clause text here..."
                      value={clauseText}
                      onChange={(e) => setClauseText(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleClauseAnalysis} className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Clause
                  </Button>
                  {knowledgeEntries && knowledgeEntries.filter(entry => entry.category === 'cp_clause').length > 0 && (
                    <div className="text-sm text-muted-foreground p-3 bg-accent rounded-lg">
                      💡 Found {knowledgeEntries.filter(entry => entry.category === 'cp_clause').length} related clauses in your knowledge base
                    </div>
                  )}
                </CardContent>
              </Card>

              {clauseResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Clause Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Clause Type:</h4>
                        <p className="text-sm bg-muted p-2 rounded">{clauseResult.clauseType}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Interpretation:</h4>
                        <p className="text-sm text-muted-foreground">{clauseResult.interpretation}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Key Implications:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {clauseResult.implications?.map((impl, idx) => (
                            <li key={idx}>• {impl}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Recommendations:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {clauseResult.recommendations?.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
