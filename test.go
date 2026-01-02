package main

import "fmt"
import (
	"encoding/json"
	"log"
	"net/http"
)

// import "rsc.io/quote"
type Type string
type Level string
type ComputeResponses string
const (
	Percentage Type = "percentage"
	Fixed      Type = "fixed"
)
const (
	CartLevel Level = "cart_level"
	TagLevel  Level = "tag_level"
)
const (
	InsufficientCartAmount ComputeResponses = "Insufficient cart amount for coupon application"
	NoApplicableItems ComputeResponses = "No applicable items for coupon application"
	Success ComputeResponses = "Coupon applied successfully"
)
type Item struct {
	ItemID string
	Name  string
	Price float64
	Tags []string
	Quantity int
}
type Cart struct {
	Item []Item
}

type Coupon struct {
	Coupon_ID string
	Org_ID  string
	Desc string
	Type Type
	DiscountAmt float64
	MinAmt float64
	MaxDiscountAmt float64
	Level Level
	Tags []string
}

type CouponDiscount struct {
	DiscountAmount float64          `json:"discount_amount"`
	Reason         ComputeResponses `json:"reason"`
}

// map to store coupon id to discount amount
var couponLevelDiscount = make(map[string]CouponDiscount)

func computeHandler (w http.ResponseWriter, r *http.Request) {
	var cart Cart
	var coupons []Coupon

	err := json.NewDecoder(r.Body).Decode(&struct {
		Cart    *Cart    `json:"cart"`
		Coupons *[]Coupon `json:"coupons"`
	}{
		Cart:    &cart,
		Coupons: &coupons,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	compute(cart, coupons)

	response, err := json.Marshal(couponLevelDiscount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}

func compute (cart Cart, coupons []Coupon) {
	couponLevelDiscount = make(map[string]CouponDiscount)
	// map to store tag to items ids
	var  productsInCoupon map[string][]string = make (map[string][]string);
	// map to store of items id to price
	var productIdPrice map[string]float64 = make (map[string]float64);

	// assuming total bill can never be greater than 2^31-1
	var totalCartAmount float64 = 0

	for _,item := range cart.Item {
		for _,tag := range item.Tags {
			productsInCoupon[tag]= append (productsInCoupon[tag], item.ItemID)
		}
		totalCartAmount+= item.Price * float64(item.Quantity)
		productIdPrice[item.ItemID] = item.Price * float64(item.Quantity)
	}
	fmt.Println (productsInCoupon)
	fmt.Println (totalCartAmount)
	// products related to particular tag to apply tag level coupon
	fmt.Println (coupons)
	for _,coupon := range coupons {
		if coupon.Level == CartLevel {
			if totalCartAmount < coupon.MinAmt {
				 couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{0, InsufficientCartAmount}
			} else if coupon.Type == Percentage {
				couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{min((float64(coupon.DiscountAmt) / 100) * totalCartAmount, coupon.MaxDiscountAmt), Success}
			} else {
				couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{coupon.DiscountAmt, Success}
			}
		} else if coupon.Level == TagLevel {
			var uniqueProductIds map[string]struct{} = make (map[string]struct{})
			for _,tag := range coupon.Tags {
				for _,productId := range productsInCoupon[tag] {
					uniqueProductIds[productId] = struct{}{}
				}
			}
			var totalTagLevelAmount float64 = 0
			for productId,_ := range uniqueProductIds {
				totalTagLevelAmount += productIdPrice[productId]
			}
			if totalTagLevelAmount < coupon.MinAmt {
				couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{0, InsufficientCartAmount}
			} else if coupon.Type == Percentage {
				couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{min((float64(coupon.DiscountAmt) / 100) * totalTagLevelAmount, coupon.MaxDiscountAmt), Success}
			} else {
				couponLevelDiscount[coupon.Coupon_ID] = CouponDiscount{coupon.DiscountAmt, Success}
			}
		}
	}
	// per coupon discount calculation
	fmt.Println (couponLevelDiscount)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// var cart Cart = Cart{
	// 	Item: []Item{Item{
	// 	ItemID: "ITEM1",
	// 	Name: "Laptop",
	// 	Price: 1,
	// 	Tags: []string{"electronics", "computer"},
	// 	Quantity: 1,
	// }, Item{
	// 	ItemID: "ITEM2",
	// 	Name: "Laptop2",
	// 	Price: 9,
	// 	Tags: []string{"electronics", "computer"},
	// 	Quantity: 2,
	// }},
	// }

	// var coupon []Coupon = []Coupon{
	// 	Coupon{
	// 		Coupon_ID: "COUPON1",
	// 		Org_ID: "ORG1",
	// 		Desc: "10% off",
	// 		Type: Percentage,
	// 		DiscountAmt: 10,
	// 		MaxDiscountAmt: 100,
	// 		MinAmt: 100,
	// 		Level: CartLevel,
	// 		Tags: []string{"electronics", "computer"},
	// 	},
	// 	Coupon{
	// 		Coupon_ID: "COUPON2",
	// 		Org_ID: "ORG1",
	// 		Desc: "$20 off",
	// 		Type: Fixed,
	// 		DiscountAmt: 20,
	// 		MaxDiscountAmt: 100,
	// 		MinAmt: 200,
	// 		Level: TagLevel,
	// 		Tags: []string{"electronics", "computer"},
	// 	},
	// }

	// var coupons map[string]Coupon = make(map[string]Coupon)
	// for _,c := range coupon {
	// 	coupons[c.Coupon_ID] = c
	// }

	
	// fmt.Println(coupons["COUPON1"])
	// compute(cart, coupon)
	http.Handle("/compute", enableCORS(http.HandlerFunc(computeHandler)))
	log.Fatal(http.ListenAndServe(":8080", nil))	
}