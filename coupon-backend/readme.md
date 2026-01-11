to generate the master key

```
openssl rand -hex 32
```

use this command and save the master key in .env file as MASTER_KEY

to generate certificates that would be used in TLS handshake for HTTPS use the following command

````
openssl req \
  -x509 \
  -newkey rsa:4096 \
  -keyout server.key \
  -out server.crt \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"```
````

do cd to certs/ before generting the certs

Before running the service create a keys.json file that would store the json keys data

to start the server, cd to coupon-backend
run `go run main.go` to start the server

for making the request to generate endpoint

```
curl -k -X POST https://localhost:8443/generate
```

this would return the API key generated which can later be used to call the hello method.
