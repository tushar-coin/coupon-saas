package entity

type GenerateResponse struct {
	APIKey string `json:"api_key"`
}

type HelloRequest struct {
	Message string `json:"message"`
}

type HelloResponse struct {
	Greeting string `json:"greeting"`
}
