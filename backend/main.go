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

func decodeBase64(encoded string) string {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return encoded
	}
	return string(decoded)
}

func judge0Handler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received submission request")
	
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqBody SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	encodedReq := SubmissionRequestEncoded{
		LanguageID: reqBody.LanguageID,
		SourceCode: base64.StdEncoding.EncodeToString([]byte(reqBody.SourceCode)),
		Stdin:      base64.StdEncoding.EncodeToString([]byte(reqBody.Stdin)),
	}

	payloadBytes, err := json.Marshal(encodedReq)
	if err != nil {
		http.Error(w, "Failed to marshal payload: "+err.Error(), http.StatusInternalServerError)
		return
	}
	payload := strings.NewReader(string(payloadBytes))

	url := "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,status,time,memory,compile_output"
	apiReq, err := http.NewRequest("POST", url, payload)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	apiReq.Header.Set("x-rapidapi-key", os.Getenv("RAPIDAPI_KEY"))
	apiReq.Header.Add("x-rapidapi-host", "judge0-ce.p.rapidapi.com")
	apiReq.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(apiReq)
	if err != nil {
		http.Error(w, "Failed to contact Judge0: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		http.Error(w, "Failed to parse JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, field := range []string{"stdout", "stderr", "compile_output"} {
		if val, ok := result[field].(string); ok && val != "" {
			result[field] = decodeBase64(val)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	json.NewEncoder(w).Encode(result)
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Could not load .env file (may be fine in production)")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := mux.NewRouter()
	r.HandleFunc("/submit", judge0Handler).Methods("POST")

	log.Printf("Server started on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}