
const fs = require('fs');
const path = require('path');

const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQN/TiLYk5XFIw
39knMO6Oh7C4yLYzNifWbO1keAGRJFP4fXoAS95CN1WVwUkA7+18TKe5klqPmzGk
57T4c9IBIdK3ZQap9l6vyV+hJlblZPMGxOsctCkXKg3V6N/ED0dg8gYdJi7rQ46v
NoQnfHCEQbsbZXARj+ziXb9249FtD5ZoZFeE3dpIjEm8lCgTI6ExHMK7IRKlfPOV
cqwSf7nzzra620EcLtgICy505LHbGDV/++SM16wmWMYZ/5CbndWpa5yMLRpUIlfP
3JwU/mlX64tlW7NBJAvMnY5qb9T0ZRscui64b3tdJsCSkfzdJuZXk/mlATOtT0d+
iFJvew71AgMBAAECggEAXXOf3xuc6Te8U99D8UkO6L2R3X2H+PgnbR+6dEtAOMpb
Pb3jUdq7SHDZYrs7bsZAindFGA7NwoJfB6pPGOuyp3tsvY8ELKg82xzAZO12NsLW
KIWdGGbrwk/HoehA9hf9a0902wRWLpVFpvIK4kYBofp2ZddjMx6rrPVyh4O8bPuw
vNGduR5qGSyI83yGgDrYvvbSmQdqjVB+QUANYCCt25tnDkPH0uhMUXyzE9zEaFmR
TqvmmWYTcvta25dhrrmKNjhm5YGbus7k9M8QGZjFUpEIIPfDpfKLN4o1IJE/eLNm
EPRa6kEBbOPXUps+1jRJVRKnemw1KBOjAQF0fbLaSQKBgQDp35ewqtcbEV58rPEL
NKALAdlpoNp2a2zkMece//Zj/H7seMokKZNC65HBt8dujf1+Yxe8QczB1E99680/
OAiBh+pyjKmDqJWfSbwpKdejQZjwlh+qXha4i3wUfh0dt0FtrO2dMO26rq1rfnVj
Eqwcmoavyhx3qhVWpHen6xTpJwKBgQDj6wE7jO5VCdQ5pMyuFibECROa+IYu3yft
rKIR4j/3f15jdQa86Lg9l6KWLdvUL0T/xCitKhX++RTFkeZhAHn5fxPXJKNYUNaL
aI159mfvtltI299ojnipfIKMKJli9MWxMYggZeUusVFQAmMD/m3Fmezjzsf7dRx/
KcifzVJAgwKBgHFPKyclHmK235h4EbDkJkYu9y7+B9on4fINW3Thfnai9ruLKiSr
H/XkPBInADDICnEZgX5sQtAGFR1lCWP/ud9IAobNL7PiEdvC1a773sXyGi82DNF2\\ FHwE2HD1SRYEm2aPye/GrOctikfyVN1TRp/1Hhw9R92SQhRgSrjIZLExAoGAfx7P
FDDZqXKO/Quu4ZYXTxWk6rWc2b27nnO//WuMs/VFZwGZnXnLcQcHNu4jAyjOOj1l
Vpf3pru0WzGyJf5HCeJX5ZJYzORhlWXeKt1FQU0bgvqnk8CLCjUY9yWZz7ioHtl6
jF9owW9C4/ZA1bRt812T48esgNLj7wUWEhNJwhMCgYEA01rxDB7o/Yfx7QRDyaGy
HWWVtB+huswHikl2vgbytgWVfoLcJi5VGKzq2BRgexd5qgpCJdKwZsaTItqV23Vr
qDy485esPICYRm10pBStdKWMo5aa8DB5r9jPhf5iTMlXG1F820hMR8P9czJDjTjW
znGWCK42fLaFxFQeQzhGjHE=
-----END PRIVATE KEY-----`;

// Remove potential copy paste errors (backslashes, spaces inside the body)
// We need to keep newlines for structure
let formatted = key.trim();

// Fix the backslash space error in line 19
// The user provided: "....DNF2\ FHw..."
// We need to remove "\ "
formatted = formatted.replace(/\\ /g, "");

// Replace standard newlines with \n literal for env var usage
formatted = formatted.replace(/\n/g, "\\n");

// Wrap in double quotes
const correctEnvValue = `"${formatted}"`;

console.log("---------------- COPY BELOW THIS LINE ----------------");
console.log(correctEnvValue);
console.log("---------------- COPY ABOVE THIS LINE ----------------");

// Also try to verify it by loading it back
try {
    const crypto = require('crypto');
    const privateKey = correctEnvValue.slice(1, -1).replace(/\\n/g, '\n');
    const signature = crypto.sign("sha256", Buffer.from("test"), privateKey);
    console.log("\n✅ Verification Successful: This is a valid RSA Private Key.");
} catch (e) {
    console.error("\n❌ Verification Failed: The key seems invalid even after formatting.", e.message);
}
