"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import axios from 'axios';
// Import new icons
import { Play, RotateCcw, Minus, Plus, Loader2, CheckCircle2, XCircle, Clock, Database } from "lucide-react"
import Footer from "@/components/footer"
import Header from "@/components/header"

// Default code templates
const cpp_code = `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "hello" << endl;
    return 0;
}
`;
const py_code = `print("hello")`;

// Judge0 Language IDs
const languageMap = {
  cpp: 52,    // C++ (GCC 7.4.0)
  python: 71, // Python (3.8.1)
};

const monacoLanguageMap = { cpp: "cpp", python: "python" };
const monacoThemeMap = { light: "light", dark: "vs-dark", monokai: "monokai" };

// Backend API URL
const API_URL = process.env.BACKEND_BASE_URL;

export default function Home() {
  const [code, setCode] = useState(cpp_code)
  const [sampleInput, setSampleInput] = useState("")
  const [language, setLanguage] = useState("cpp")
  const [theme, setTheme] = useState("dark")
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState("Fira Code")

  const [output, setOutput] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("Ready to run.")

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(lang === 'cpp' ? cpp_code : py_code);
    setOutput(null);
  }
  
  const handleReset = () => {
    setCode(language === 'cpp' ? cpp_code : py_code);
    setOutput(null);
    setStatus("Ready to run.");
  }

  const handleExecuteCode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setOutput(null);
    setStatus("Executing...");

    try {
      // Construct the payload with the current code, language, and input
      const payload = {
        language_id: languageMap[language],
        source_code: code,
        stdin: sampleInput,
      };

      // Make a single POST request and await the full result.
      // The backend's /submit endpoint must now wait for execution to complete.
      const response = await axios.post(`${API_URL}/submit`, payload);

      // The response.data should now contain the full output object
      const resultData = response.data;

      // Set the output and update the status
      setOutput(resultData);
      setStatus("Finished.");

    } catch (error) {
      console.error("An error occurred:", error);

      // Handle potential errors from the API call
      let errorMessage = "An unknown error occurred";
      if (axios.isAxiosError(error) && error.response) {
        // If the backend returns a structured error, display it
        const { stderr, compile_output, message } = error.response.data;
        errorMessage = stderr || compile_output || message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setStatus(`Error: ${errorMessage}`);
      
      // Also, you can set the output to show the error in the terminal
      setOutput({
          stderr: errorMessage,
          status: { description: 'Error' }
      });

    } finally {
      // Ensure loading state is turned off regardless of success or failure
      setIsLoading(false);
    }
  };


  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-background' : 'bg-gray-900 text-white'}`}>
      <Header/>
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          {/* Code Editor Pane */}
          <Card className="flex flex-col bg-transparent border-gray-700">
             {/* ... Header with language, theme, font selectors ... */}
             <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.max(10, fontSize - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.min(24, fontSize + 1))}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-2">
                 <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="python">Python</SelectItem><SelectItem value="cpp">C++</SelectItem></SelectContent>
                 </Select>
                 <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="monokai">Monokai</SelectItem></SelectContent>
                 </Select>
                 <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Fira Code">Fira Code</SelectItem><SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem><SelectItem value="Courier New">Courier New</SelectItem></SelectContent>
                 </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 mt-2">
              <Editor
                height="100%"
                language={monacoLanguageMap[language]}
                theme={monacoThemeMap[theme]}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ fontSize, fontFamily, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
              <div className="flex items-center space-x-2 mt-4">
                <Button onClick={handleExecuteCode} disabled={isLoading} className="flex items-center space-x-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span>{isLoading ? status : "Run Code"}</span>
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4" /><span>Reset</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Input/Output Pane */}
          <Card className="flex flex-col bg-transparent border-gray-700">
             <CardContent className="flex-1 flex flex-col p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Input (stdin)</h3>
                  <Textarea
                    value={sampleInput}
                    onChange={(e) => setSampleInput(e.target.value)}
                    className="h-24 resize-none font-mono bg-card text-card-foreground"
                    placeholder="Enter input here..."
                  />
                </div>

                {/* --- NEW: Results Summary --- */}
                {output && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Results</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className={`flex items-center gap-2 p-2 rounded-md ${output.status.id === 3 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {output.status.id === 3 ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        <span>{output.status.description}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-md bg-gray-500/10 text-gray-400">
                        <Clock size={18} />
                        <span>{output.time}s</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-md bg-gray-500/10 text-gray-400">
                        <Database size={18} />
                        <span>{output.memory} KB</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold mb-2 text-sm">Terminal</h3>
                  <div className="flex-1 bg-black text-white rounded-md p-3 font-mono text-sm overflow-auto">
                    {output?.stdout && <pre>{output.stdout}</pre>}
                    {output?.stderr && <pre className="text-red-400">{output.stderr}</pre>}
                    {output?.compile_output && <pre className="text-yellow-400">{output.compile_output}</pre>}
                    {!output && <div className="text-gray-500">{status}</div>}
                    {output && !output.stdout && !output.stderr && !output.compile_output &&
                      <div className="text-gray-500">Execution successful. No output.</div>
                    }
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
