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
