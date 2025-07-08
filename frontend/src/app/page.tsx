"use client"

import { useState } from "react"
import { loadEnvConfig } from '@next/env'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play, RotateCcw, Send, Minus, Plus, Loader2 } from "lucide-react"
import Footer from "@/components/footer"
import Header from "@/components/header"

// Default code templates
const cpp_code = `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}
`;

const py_code = `print("Hello, Python!")`;

// Judge0 Language IDs
const languageMap = {
  cpp: 52,    // C++ (GCC 7.4.0)
  python: 71, // Python (3.8.1)
};

// Backend API URL
const API_URL = process.env.BACKEND_BASE_URL;

export default function Home() {
  const [code, setCode] = useState(cpp_code)
  const [sampleInput, setSampleInput] = useState("")
  const [language, setLanguage] = useState("cpp")
  const [theme, setTheme] = useState("light")
  const [fontSize, setFontSize] = useState(14)

  // State for API interaction
  const [output, setOutput] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("Output will appear here...")

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(lang === 'cpp' ? cpp_code : py_code);
    setOutput(null); // Clear output on language change
  }
  
  const handleReset = () => {
    setCode(language === 'cpp' ? cpp_code : py_code);
    setOutput(null);
    setStatus("Output will appear here...");
  }

  const handleExecuteCode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setOutput(null);
    setStatus("Submitting code...");

    try {
      // Step 1: Submit code and get a token
      const submitResponse = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_id: languageMap[language],
          source_code: code,
          stdin: sampleInput,
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(`Submission failed: ${submitResponse.statusText}`);
      }

      const { token } = await submitResponse.json();
      setStatus("Code submitted, executing...");

      // Step 2: Poll for the result
      const pollInterval = setInterval(async () => {
        const resultResponse = await fetch(`${API_URL}/result/${token}`);
        const resultData = await resultResponse.json();
        
        // Status IDs 1 (In Queue) and 2 (Processing) mean it's not done yet.
        if (resultData.status && resultData.status.id > 2) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setOutput(resultData);
          setStatus(`Execution finished: ${resultData.status.description}`);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error("An error occurred:", error);
      setStatus(`Error: ${error.message}`);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header/>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          {/* Code Editor Pane */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                 {/* ... Font size controls ... */}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Language:</label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 {/* ... Theme selector ... */}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 font-mono resize-none"
                style={{ fontSize: `${fontSize}px` }}
                placeholder="Write your code here..."
              />

              <div className="flex items-center space-x-2 mt-4">
                <Button onClick={handleExecuteCode} disabled={isLoading} className="flex items-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span>{isLoading ? "Running..." : "Run Code"}</span>
                </Button>
                <Button onClick={handleExecuteCode} disabled={isLoading} variant="default" className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Submit</span>
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex items-center space-x-2 bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Input/Output/Terminal Pane */}
          <Card className="flex flex-col">
             <CardContent className="flex-1 flex flex-col p-4 space-y-4">
                {/* Sample Input Section */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Input (stdin)</h3>
                  <Textarea
                    value={sampleInput}
                    onChange={(e) => setSampleInput(e.target.value)}
                    className="h-32 resize-none font-mono"
                    placeholder="Enter input here..."
                  />
                </div>

                {/* Terminal Section */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold mb-2 text-sm">Output</h3>
                   <div className="p-1 text-sm text-muted-foreground">{status}</div>
                  <div className="flex-1 bg-black text-white rounded-md p-3 font-mono text-sm overflow-auto">
                    {output?.stdout && <pre>{output.stdout}</pre>}
                    {output?.stderr && <pre className="text-red-400">{output.stderr}</pre>}
                    {output?.compile_output && <pre className="text-yellow-400">{output.compile_output}</pre>}
                  </div>
                </div>
              </CardContent>
          </Card>
        </div>
      </div>
      <Footer/>
    </div>
  )
}
