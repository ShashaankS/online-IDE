"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play, RotateCcw, Send, Minus, Plus } from "lucide-react"
import Footer from "@/components/footer"
import Header from "@/components/header"

const cpp_code = `#include <bits/stdc++.h>
using namespace std;

int main() {
	// your code goes here

}
`;

const py_code = '# your code goes here';

export default function Home() {
  const [code, setCode] = useState(cpp_code)

  const [sampleInput, setSampleInput] = useState("Enter sample input here...")
  const [language, setLanguage] = useState("cpp")
  const [theme, setTheme] = useState("light")
  const [fontSize, setFontSize] = useState(14)

  const [terminalOutput] = useState([
    "> Compiling...",
    "> Running tests...",
    "> Output: Hello World",
    "> Execution completed in 0.23s",
  ])

  const handleRunCode = () => {
    console.log("Running code...")
  }

  const handleSubmit = () => {
    console.log("Submitting solution...")
  }

  const handleReset = () => {cpp_code}

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header/>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          {/* Code Editor Pane */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.max(10, fontSize - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
                  <Button variant="outline" size="sm" onClick={() => setFontSize(Math.min(24, fontSize + 1))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Language:</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Theme:</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="monokai">Monokai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <Button onClick={handleRunCode} className="flex items-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>Run Code</span>
                </Button>
                <Button onClick={handleSubmit} variant="default" className="flex items-center space-x-2">
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
            <CardContent className="flex-1 p-0">
              <div className="flex-1 flex flex-col space-y-4 p-4">
                {/* Sample Input Section */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm">Sample Input</h3>
                  <Textarea
                    value={sampleInput}
                    onChange={(e) => setSampleInput(e.target.value)}
                    className="h-32 resize-none font-mono"
                    placeholder="Enter sample input here..."
                  />
                </div>

                {/* Sample Output Section */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm">Sample Output</h3>
                  <div className="h-32 bg-muted/50 rounded-md p-3 font-mono text-sm overflow-auto">
                    <div className="text-muted-foreground">Expected output will appear here...</div>
                    <div className="mt-2">Hello World</div>
                  </div>
                </div>

                {/* Terminal Section */}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm">Terminal/Console</h3>
                  <div className="h-32 bg-black text-green-400 rounded-md p-3 font-mono text-sm overflow-auto">
                    {terminalOutput.map((line, index) => (
                      <div key={index} className="mb-1">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer/>
    </div>
  )
}
