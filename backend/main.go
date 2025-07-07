package main

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type SubmissionRequest struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

type SubmissionRequestEncoded struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

func judge0Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqBody SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	encodedReq := SubmissionRequestEncoded{
		LanguageID: reqBody.LanguageID,
		SourceCode: base64.StdEncoding.EncodeToString([]byte(reqBody.SourceCode)),
		Stdin:      base64.StdEncoding.EncodeToString([]byte(reqBody.Stdin)),
	}

	payloadBytes, err := json.Marshal(encodedReq)
	if err != nil {
		http.Error(w, "Failed to marshal payload", http.StatusInternalServerError)
		return
	}
	payload := strings.NewReader(string(payloadBytes))

	url := "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true&fields=*" 
	apiReq, err := http.NewRequest("POST", url, payload)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	apiReq.Header.Set("x-rapidapi-key", os.Getenv("RAPIDAPI_KEY"))
	apiReq.Header.Add("x-rapidapi-host", "judge0-ce.p.rapidapi.com")
	apiReq.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(apiReq)
	if err != nil {
		http.Error(w, "Failed to contact Judge0", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func getResultHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	token := vars["token"]
	if token == "" {
		http.Error(w, "Token required", http.StatusBadRequest)
		return
	}

	url := "https://judge0-ce.p.rapidapi.com/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,status_id,language_id"
	apiReq, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	apiReq.Header.Set("x-rapidapi-key", os.Getenv("RAPIDAPI_KEY"))
	apiReq.Header.Add("x-rapidapi-host", "judge0-ce.p.rapidapi.com")

	client := &http.Client{}
	resp, err := client.Do(apiReq)
	if err != nil {
		http.Error(w, "Failed to contact Judge0", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		http.Error(w, "Failed to parse JSON", http.StatusInternalServerError)
		return
	}

	decodeBase64 := func(encoded string) string {
		decoded, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			return encoded
		}
		return string(decoded)
	}

	if stdout, ok := result["stdout"].(string); ok && stdout != "" {
		result["stdout"] = decodeBase64(stdout)
	}
	if stderr, ok := result["stderr"].(string); ok && stderr != "" {
		result["stderr"] = decodeBase64(stderr)
	}
	if compileOutput, ok := result["compile_output"].(string); ok && compileOutput != "" {
		result["compile_output"] = decodeBase64(compileOutput)
	}
	if message, ok := result["message"].(string); ok && message != "" {
		result["message"] = decodeBase64(message)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	json.NewEncoder(w).Encode(result)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	r := mux.NewRouter()
	r.HandleFunc("/submit", judge0Handler).Methods("POST")
	r.HandleFunc("/result/{token}", getResultHandler).Methods("GET")

	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
