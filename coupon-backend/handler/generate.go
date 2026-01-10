package handler

import (
	"encoding/json"
	"example/coupon_computation/coupon-backend/controller"
	"example/coupon_computation/coupon-backend/entity"
	"fmt"
	"io"
	"net/http"
)

func GenerateHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Generating API key...")
	key, err := controller.GenerateAPIKeyLogic()
	fmt.Println("Generated API key:", key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(entity.GenerateResponse{APIKey: key})
}

func HelloHandler(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	json.Unmarshal(body, &entity.HelloRequest{})
	resp := controller.HelloLogic("")
	json.NewEncoder(w).Encode(entity.HelloResponse{Greeting: resp})
}
